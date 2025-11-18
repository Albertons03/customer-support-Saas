// Supabase Edge Function: AI Chat
// Purpose: Securely handle OpenAI API calls with rate limiting and usage tracking

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: Message[];
  conversationId?: string;
  workspaceId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const {
      messages,
      conversationId,
      workspaceId = "00000000-0000-0000-0000-000000000001",
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // RATE LIMITING: Check user's requests in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentRequests, error: rateLimitError } = await supabaseClient
      .from("ai_usage")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", oneHourAgo);

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
    }

    const requestCount = recentRequests?.length || 0;
    if (requestCount >= 20) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Maximum 20 requests per hour.",
          retryAfter:
            3600 -
            Math.floor(
              (Date.now() - new Date(recentRequests![0].created_at).getTime()) /
                1000
            ),
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // MONTHLY QUOTA: Check workspace token usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyUsage, error: quotaError } = await supabaseClient
      .from("ai_usage")
      .select("token_count")
      .eq("workspace_id", workspaceId)
      .gte("created_at", startOfMonth.toISOString());

    if (quotaError) {
      console.error("Quota check error:", quotaError);
    }

    const totalTokens =
      monthlyUsage?.reduce((sum, row) => sum + (row.token_count || 0), 0) || 0;

    // Max 1 million tokens per month (~$2 for GPT-3.5-turbo)
    if (totalTokens > 1000000) {
      return new Response(
        JSON.stringify({
          error: "Monthly AI quota exceeded (1M tokens)",
          usage: { current: totalTokens, limit: 1000000 },
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call OpenAI API
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages,
          max_tokens: 800,
          temperature: 0.7,
          stream: false,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      console.error("OpenAI API error:", error);
      return new Response(
        JSON.stringify({
          error: "OpenAI API error",
          details: error.error?.message || "Unknown error",
        }),
        {
          status: openaiResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await openaiResponse.json();
    const assistantMessage = data.choices[0].message.content;
    const tokensUsed = data.usage.total_tokens;

    // Calculate cost (GPT-3.5-turbo: $0.002 per 1K tokens)
    const costEstimate = (tokensUsed / 1000) * 0.002;

    // Log usage to database
    const { error: usageError } = await supabaseClient.from("ai_usage").insert({
      workspace_id: workspaceId,
      user_id: user.id,
      conversation_id: conversationId || null,
      token_count: tokensUsed,
      cost_estimate: costEstimate,
      model: "gpt-3.5-turbo",
      prompt_tokens: data.usage.prompt_tokens,
      completion_tokens: data.usage.completion_tokens,
    });

    if (usageError) {
      console.error("Failed to log usage:", usageError);
      // Don't fail the request if logging fails
    }

    // Save assistant message to conversation (if conversationId provided)
    if (conversationId) {
      const { error: messageError } = await supabaseClient
        .from("conversation_messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: assistantMessage,
          model: "gpt-3.5-turbo",
          tokens_used: tokensUsed,
        });

      if (messageError) {
        console.error("Failed to save message:", messageError);
      }
    }

    // Return response
    return new Response(
      JSON.stringify({
        message: assistantMessage,
        usage: {
          tokens: tokensUsed,
          cost: costEstimate,
          monthlyTotal: totalTokens + tokensUsed,
          monthlyLimit: 1000000,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
