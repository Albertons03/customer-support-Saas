// Helper functions for calling Supabase Edge Function for AI chat
import { supabase } from "./supabase";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AIChatRequest {
  messages: Message[];
  conversationId?: string;
  workspaceId?: string;
}

interface AIChatResponse {
  message: string;
  usage: {
    tokens: number;
    cost: number;
    monthlyTotal: number;
    monthlyLimit: number;
  };
}

interface AIError {
  error: string;
  details?: string;
  retryAfter?: number;
  usage?: {
    current: number;
    limit: number;
  };
}

/**
 * Call AI chat Edge Function with messages
 * Returns the assistant's response
 */
export async function callAIChat(
  request: AIChatRequest
): Promise<AIChatResponse> {
  try {
    // Get current session token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Not authenticated");
    }

    // Call Edge Function
    const { data, error } = await supabase.functions.invoke("ai-chat", {
      body: request,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error("Edge function error:", error);
      throw new Error(error.message || "Failed to call AI chat");
    }

    // Check for application-level errors
    if (data.error) {
      const aiError = data as AIError;
      throw new Error(aiError.error);
    }

    return data as AIChatResponse;
  } catch (error) {
    console.error("AI chat error:", error);
    throw error;
  }
}

/**
 * Stream AI chat response (for future streaming implementation)
 * Currently not supported by the Edge Function
 */
export async function* streamAIChat(
  request: AIChatRequest
): AsyncGenerator<string> {
  // For now, just call the regular function and yield the full response
  const response = await callAIChat(request);
  yield response.message;
}

/**
 * Get user's rate limit status
 */
export async function getUserRateLimit() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const { data, error } = await supabase.rpc("get_user_rate_limit", {
      p_user_id: user.id,
    });

    if (error) throw error;

    return data[0] || null;
  } catch (error) {
    console.error("Error getting rate limit:", error);
    return null;
  }
}

/**
 * Get workspace monthly quota status
 */
export async function getWorkspaceMonthlyQuota(
  workspaceId: string = "00000000-0000-0000-0000-000000000001"
) {
  try {
    const { data, error } = await supabase.rpc("get_workspace_monthly_quota", {
      p_workspace_id: workspaceId,
    });

    if (error) throw error;

    return data[0] || null;
  } catch (error) {
    console.error("Error getting monthly quota:", error);
    return null;
  }
}

/**
 * Get usage statistics for dashboard
 */
export async function getUsageStats(
  workspaceId: string = "00000000-0000-0000-0000-000000000001",
  days: number = 30
) {
  try {
    const { data, error } = await supabase.rpc("get_usage_stats", {
      p_workspace_id: workspaceId,
      p_days: days,
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error getting usage stats:", error);
    return [];
  }
}
