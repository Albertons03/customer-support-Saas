import { useState, useRef, useEffect } from "react";
import { X, Minimize2, Send, MessageCircle, AlertCircle } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { streamChatMessage } from "../../lib/openai";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatWidgetProps {
  companyName?: string;
  position?: "bottom-right" | "bottom-left";
}

const SYSTEM_PROMPT = `You are a helpful customer support assistant. Be concise, professional, and empathetic.

Guidelines:
- Provide clear, actionable solutions
- Be friendly and understanding
- Keep responses under 200 words when possible
- If you cannot solve the issue, offer to create a support ticket
- Never make promises you can't keep

If you cannot answer a question or the issue requires human intervention, respond with:
"I'd be happy to connect you with our support team. Would you like me to create a ticket for you?"`;

export function ChatWidget({
  companyName = "SupportHub",
  position = "bottom-right",
}: ChatWidgetProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize conversation when chat opens
  useEffect(() => {
    if (isOpen && !conversationId) {
      initializeConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Load existing conversation or create new one
  const initializeConversation = async () => {
    try {
      const workspaceId = "00000000-0000-0000-0000-000000000001"; // Default workspace
      const customerEmail = user?.email || "anonymous@example.com";
      const customerName = user?.email?.split("@")[0] || "Anonymous";

      // Check for existing active conversation
      const { data: existingConversations, error: fetchError } = await supabase
        .from("conversations")
        .select("*")
        .eq("customer_email", customerEmail)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error("Error fetching conversations:", fetchError);
        // Continue without DB for demo
        addWelcomeMessage();
        return;
      }

      if (existingConversations && existingConversations.length > 0) {
        // Load existing conversation
        const conversation = existingConversations[0] as { id: string };
        setConversationId(conversation.id);
        await loadConversationHistory(conversation.id);
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from("conversations")
          .insert({
            workspace_id: workspaceId,
            customer_id: user?.id || null,
            customer_email: customerEmail,
            customer_name: customerName,
            status: "active",
          } as any)
          .select()
          .single();

        if (createError) {
          console.error("Error creating conversation:", createError);
          addWelcomeMessage();
          return;
        }

        setConversationId((newConversation as { id: string }).id);
        addWelcomeMessage();
      }
    } catch (error) {
      console.error("Error initializing conversation:", error);
      addWelcomeMessage();
    }
  };

  const addWelcomeMessage = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Hi! 👋 I'm your ${companyName} AI assistant. How can I help you today?`,
        timestamp: new Date(),
      },
    ]);
  };

  const loadConversationHistory = async (convId: string) => {
    try {
      const { data: messageHistory, error } = await supabase
        .from("conversation_messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading history:", error);
        addWelcomeMessage();
        return;
      }

      if (messageHistory && messageHistory.length > 0) {
        type DBMessage = {
          id: string;
          role: string;
          content: string;
          created_at: string;
        };
        const loadedMessages: Message[] = (messageHistory as DBMessage[])
          .filter((m) => m.role !== "system")
          .map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: new Date(m.created_at),
          }));
        setMessages(loadedMessages);
      } else {
        addWelcomeMessage();
      }
    } catch (error) {
      console.error("Error loading conversation history:", error);
      addWelcomeMessage();
    }
  };

  const saveMessage = async (
    role: "user" | "assistant" | "system",
    content: string
  ): Promise<string | null> => {
    if (!conversationId) return null;

    try {
      const { data, error } = await supabase
        .from("conversation_messages")
        .insert({
          conversation_id: conversationId,
          role,
          content,
          model: role === "assistant" ? "gpt-3.5-turbo" : null,
        } as any)
        .select()
        .single();

      if (error) {
        console.error("Error saving message:", error);
        return null;
      }

      return (data as { id: string }).id;
    } catch (error) {
      console.error("Error saving message:", error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessageContent = inputValue.trim();
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      // Save user message to DB
      const savedUserId = await saveMessage("user", userMessageContent);
      if (savedUserId) {
        // Update temp ID with real ID
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMessage.id ? { ...m, id: savedUserId } : m
          )
        );
      }

      // Prepare conversation history (last 10 messages)
      const recentMessages = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Add system prompt
      const chatMessages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        ...recentMessages,
        { role: "user" as const, content: userMessageContent },
      ];

      // Stream AI response
      let aiResponseContent = "";
      const aiMessageId = `temp-ai-${Date.now()}`;
      const aiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Stream the response
      for await (const chunk of streamChatMessage({ messages: chatMessages })) {
        aiResponseContent += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId ? { ...m, content: aiResponseContent } : m
          )
        );
      }

      // Save AI response to DB
      const savedAiId = await saveMessage("assistant", aiResponseContent);
      if (savedAiId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMessageId ? { ...m, id: savedAiId } : m))
        );
      }

      // Check if AI suggests creating a ticket
      if (
        aiResponseContent.toLowerCase().includes("create a ticket") ||
        aiResponseContent.toLowerCase().includes("support team")
      ) {
        // Could add a button here to create a ticket
      }
    } catch (error) {
      console.error("Error in chat:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to get response. Please try again.";
      setError(errorMessage);

      // Add error message to chat
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "I'm sorry, I'm having trouble connecting right now. Please try again or contact our support team directly.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${positionClasses[position]} z-50 w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform duration-200 flex items-center justify-center group`}
          aria-label="Open chat"
        >
          <MessageCircle className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed ${
            positionClasses[position]
          } z-50 transition-all duration-300 ${
            isMinimized ? "h-14" : "h-[600px]"
          } w-full max-w-[400px] sm:w-[400px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-slideUp`}
          style={{
            maxHeight: "calc(100vh - 2rem)",
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">{companyName} Support</h3>
                <p className="text-xs text-purple-100">
                  AI Assistant •{" "}
                  {conversationId ? "Connected" : "Connecting..."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
                aria-label="Minimize chat"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                  />
                ))}
                {isLoading && (
                  <ChatMessage
                    role="assistant"
                    content=""
                    timestamp={new Date()}
                    isTyping={true}
                  />
                )}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    aria-label="Chat message input"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    aria-label="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Powered by GPT-3.5 Turbo • Press Enter to send
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Mobile Full Screen Overlay */}
      {isOpen && (
        <style>{`
          @media (max-width: 640px) {
            .chat-widget-container {
              position: fixed !important;
              inset: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              height: 100vh !important;
              max-height: 100vh !important;
              border-radius: 0 !important;
            }
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          .animate-slideUp {
            animation: slideUp 0.3s ease-out;
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
        `}</style>
      )}
    </>
  );
}
