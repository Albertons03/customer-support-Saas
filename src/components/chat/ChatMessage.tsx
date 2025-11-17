interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return date.toLocaleDateString();
}

export function ChatMessage({
  role,
  content,
  timestamp,
  isTyping,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      } mb-4 animate-fadeIn`}
    >
      <div
        className={`flex gap-2 max-w-[80%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser
              ? "bg-gradient-to-br from-indigo-600 to-purple-600"
              : "bg-gradient-to-br from-gray-400 to-gray-600"
          }`}
        >
          <span className="text-white text-xs font-semibold">
            {isUser ? "You" : "AI"}
          </span>
        </div>

        {/* Message Bubble */}
        <div className="flex flex-col">
          <div
            className={`rounded-2xl px-4 py-3 shadow-sm ${
              isUser
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                : "bg-white text-gray-800 border border-gray-200"
            }`}
          >
            {isTyping ? (
              <div className="flex gap-1 items-center py-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words">
                {content}
              </p>
            )}
          </div>

          {/* Timestamp */}
          {!isTyping && (
            <span
              className={`text-xs text-gray-500 mt-1 px-1 ${
                isUser ? "text-right" : "text-left"
              }`}
            >
              {formatDistanceToNow(timestamp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
