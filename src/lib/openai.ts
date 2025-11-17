import OpenAI from "openai";

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.warn("OpenAI API key not found. AI chat features will not work.");
}

// Initialize OpenAI client
export const openai = apiKey
  ? new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // Note: In production, proxy through your backend
    })
  : null;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

/**
 * Send a message to GPT-4 and get a response
 */
export async function sendChatMessage(
  options: ChatCompletionOptions
): Promise<string> {
  if (!openai) {
    throw new Error(
      "OpenAI client is not initialized. Please add VITE_OPENAI_API_KEY to your .env file."
    );
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 500,
      stream: false,
    });

    return (
      response.choices[0]?.message?.content ||
      "Sorry, I could not generate a response."
    );
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error("Failed to get AI response. Please try again.");
  }
}

/**
 * Send a message to GPT-3.5 with streaming support
 */
export async function* streamChatMessage(
  options: ChatCompletionOptions
): AsyncGenerator<string, void, unknown> {
  if (!openai) {
    throw new Error(
      "OpenAI client is not initialized. Please add VITE_OPENAI_API_KEY to your .env file."
    );
  }

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 800,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error("Error streaming from OpenAI API:", error);
    throw new Error("Failed to stream AI response. Please try again.");
  }
}

/**
 * Create a system prompt for customer support
 */
export function createSystemPrompt(companyName: string = "SupportHub"): string {
  return `You are a helpful AI customer support assistant for ${companyName}. 
Your role is to:
- Help customers with their questions and issues
- Be friendly, professional, and empathetic
- Provide clear and concise answers
- If you don't know something, be honest and offer to connect them with a human agent
- Keep responses conversational but informative
- Be proactive in asking clarifying questions when needed

Always maintain a positive and helpful tone.`;
}

/**
 * Format conversation history for context
 */
export function formatConversationHistory(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  maxMessages: number = 10
): ChatMessage[] {
  // Take only the last N messages to avoid token limits
  const recentMessages = messages.slice(-maxMessages);

  return recentMessages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * Test function to verify OpenAI integration
 */
export async function testOpenAI(): Promise<boolean> {
  if (!openai) {
    console.error("OpenAI client is not initialized");
    return false;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content:
            'Say "Hello, OpenAI integration is working!" in a friendly way.',
        },
      ],
      max_tokens: 50,
    });

    const message = response.choices[0]?.message?.content;
    console.log("✅ OpenAI Test Response:", message);
    return true;
  } catch (error) {
    console.error("❌ OpenAI Test Failed:", error);
    return false;
  }
}
