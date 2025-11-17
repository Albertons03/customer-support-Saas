# AI Chat Widget - Full Integration Guide

## 🎯 Overview

The ChatWidget has been fully integrated with:

- ✅ **Supabase database persistence** - All conversations are saved
- ✅ **OpenAI streaming responses** - Real-time token-by-token display
- ✅ **Conversation history** - Load previous chat sessions
- ✅ **Smart context** - Sends last 10 messages to OpenAI for better responses
- ✅ **System prompt** - Professional, concise, empathetic assistant
- ✅ **Ticket creation offer** - Detects when AI should escalate to human support

## 📋 Prerequisites

Before using the chat widget, you need to:

### 1. Run the Database Migration

The chat widget requires new database tables. Apply the migration:

```bash
# Navigate to your Supabase project dashboard
# Go to: SQL Editor
# Copy the contents of: supabase/migrations/002_chat_conversations.sql
# Run the migration
```

Or if you're using Supabase CLI:

```bash
supabase db push
```

This creates:

- `conversations` table - Stores chat sessions
- `conversation_messages` table - Stores individual messages
- Triggers for automatic timestamp updates
- RLS policies for security
- Helper function `get_conversation_history()`

### 2. Add OpenAI API Key

Add your OpenAI API key to `.env`:

```env
VITE_OPENAI_API_KEY=sk-your-key-here
```

Get your API key from: https://platform.openai.com/api-keys

## 🚀 Usage

The ChatWidget is already integrated into the Dashboard:

```tsx
import { ChatWidget } from "../components/chat";

<ChatWidget companyName="SupportHub" position="bottom-right" />;
```

### Props

- `companyName` (optional): Your company name (default: "SupportHub")
- `position` (optional): "bottom-right" or "bottom-left" (default: "bottom-right")

## 🔄 How It Works

### 1. Conversation Initialization

When a user opens the chat:

1. Checks for existing active conversation (by email)
2. If found, loads previous messages from database
3. If not found, creates new conversation record

### 2. Message Flow

**User sends message:**

1. Message displayed immediately in UI
2. Saved to `conversation_messages` table
3. Last 10 messages prepared as context
4. System prompt added
5. Sent to OpenAI GPT-4

**AI responds:**

1. Response streams token-by-token from OpenAI
2. Displayed in real-time (typewriter effect)
3. Complete response saved to database
4. Conversation timestamp updated

### 3. Conversation History

- All messages persisted to Supabase
- Loaded automatically when returning user opens chat
- Last 10 messages used as context for OpenAI
- Improves response quality and continuity

### 4. Smart Escalation

The system prompt instructs the AI to offer ticket creation when:

- It cannot solve the issue
- The issue requires human intervention
- The conversation is going in circles

Detection logic checks if AI response contains:

- "create a ticket"
- "support team"

You can extend this to show a button for automatic ticket creation.

## 🎨 Features

### Streaming Responses

Uses OpenAI's streaming API for real-time responses:

```typescript
for await (const chunk of streamChatMessage({ messages })) {
  aiResponseContent += chunk;
  // Update UI with each token
}
```

### Smart Context Window

Only sends last 10 messages to OpenAI to:

- Reduce API costs
- Stay within token limits
- Maintain conversation relevance

### Error Handling

- Graceful fallback if database unavailable
- Error messages displayed in chat
- Logs errors to console for debugging

### Mobile Responsive

- Full screen on mobile devices
- Minimizable on desktop
- Smooth animations

## 🔐 Security

Row Level Security (RLS) policies ensure:

- Customers only see their own conversations
- Agents can view all conversations
- Workspace isolation

## 📊 Database Schema

### conversations

```sql
id: uuid (primary key)
workspace_id: uuid (foreign key)
customer_id: uuid (nullable, foreign key to profiles)
customer_email: text (required)
customer_name: text (nullable)
status: enum ('active', 'closed')
last_message_at: timestamp (auto-updated)
created_at, updated_at: timestamps
```

### conversation_messages

```sql
id: uuid (primary key)
conversation_id: uuid (foreign key)
role: enum ('user', 'assistant', 'system')
content: text (required)
tokens_used: integer (nullable)
model: text (nullable, e.g., 'gpt-4')
created_at: timestamp
```

## 🧪 Testing

Test the chat integration:

```bash
# In the project root
npm run dev

# Open browser to http://localhost:5173
# Login
# Click the chat button in bottom-right
# Send a message
# Verify:
# - Streaming response appears token-by-token
# - Messages saved to Supabase (check database)
# - Reload page and reopen chat - history should load
```

## 🔧 Customization

### Change System Prompt

Edit `SYSTEM_PROMPT` in `src/components/chat/ChatWidget.tsx`:

```typescript
const SYSTEM_PROMPT = `You are a helpful customer support assistant. Be concise, professional, and empathetic.

Guidelines:
- Provide clear, actionable solutions
- Be friendly and understanding
- Keep responses under 200 words when possible
- If you cannot solve the issue, offer to create a support ticket
- Never make promises you can't keep
`;
```

### Adjust Context Window

Change the number of messages sent to OpenAI:

```typescript
// In handleSendMessage function
const recentMessages = messages
  .slice(-10) // Change this number
  .map((m) => ({
    role: m.role,
    content: m.content,
  }));
```

### Add Ticket Creation Button

When AI suggests creating a ticket, show a button:

```typescript
// Check if AI suggests creating a ticket
if (
  aiResponseContent.toLowerCase().includes("create a ticket") ||
  aiResponseContent.toLowerCase().includes("support team")
) {
  // Show button to create ticket
  // Navigate to /tickets/new with pre-filled data
}
```

## 📈 Monitoring

Monitor chat usage:

```sql
-- Total conversations
SELECT COUNT(*) FROM conversations;

-- Messages per conversation
SELECT
  conversation_id,
  COUNT(*) as message_count
FROM conversation_messages
GROUP BY conversation_id;

-- Average messages per conversation
SELECT AVG(msg_count) as avg_messages
FROM (
  SELECT COUNT(*) as msg_count
  FROM conversation_messages
  GROUP BY conversation_id
) counts;

-- Token usage
SELECT
  SUM(tokens_used) as total_tokens,
  model
FROM conversation_messages
WHERE tokens_used IS NOT NULL
GROUP BY model;
```

## 🐛 Troubleshooting

### "Failed to get response"

- Check VITE_OPENAI_API_KEY in .env
- Verify OpenAI API key is valid
- Check browser console for errors

### Messages not saving

- Run the database migration (002_chat_conversations.sql)
- Check Supabase connection
- Verify RLS policies allow inserts

### Old messages not loading

- Check conversation_id is set correctly
- Verify messages exist in database
- Check browser console for query errors

## 📚 Related Files

- `src/components/chat/ChatWidget.tsx` - Main chat component
- `src/components/chat/ChatMessage.tsx` - Message display
- `src/lib/openai.ts` - OpenAI integration
- `supabase/migrations/002_chat_conversations.sql` - Database schema
- `src/types/database.ts` - TypeScript types

## 🎉 Next Steps

1. ✅ Run database migration
2. ✅ Add OpenAI API key
3. ✅ Test chat widget
4. 🔜 Add ticket creation button
5. 🔜 Add conversation list for agents
6. 🔜 Add typing indicators when agent responds
7. 🔜 Add file attachments
8. 🔜 Add conversation ratings

## 💡 Tips

- Start conversations by asking specific questions
- AI works best with clear, concise queries
- History helps AI understand context better
- Monitor token usage to manage costs
- Adjust system prompt for your brand voice
