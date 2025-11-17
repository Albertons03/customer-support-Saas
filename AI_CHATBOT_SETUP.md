# AI Chatbot Setup Guide

## OpenAI Integration

This project includes an AI-powered chatbot using OpenAI's GPT-4 API.

### Setup Instructions

1. **Get an OpenAI API Key**

   - Go to [OpenAI Platform](https://platform.openai.com/)
   - Sign up or log in
   - Navigate to API Keys
   - Create a new API key

2. **Configure Environment Variables**

   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Add your OpenAI API key to `.env`:
     ```
     VITE_OPENAI_API_KEY=sk-your-api-key-here
     ```

3. **Test the Integration**
   - Open the browser console
   - Import the test function:
     ```javascript
     import { runOpenAITest } from "./src/test-openai";
     runOpenAITest();
     ```
   - Or simply visit the Dashboard - the chat widget appears automatically

### Features

✅ **Embeddable Chat Widget**

- Floating button in bottom-right corner
- Expandable chat window
- Minimize/maximize functionality
- Mobile responsive (full-screen on mobile)

✅ **AI-Powered Responses**

- GPT-4 integration
- Context-aware conversations
- Conversation history maintained
- Streaming support ready

✅ **Professional UI**

- Smooth animations
- User/AI message differentiation
- Typing indicators
- Timestamps
- Keyboard shortcuts (Enter to send)

### Usage

The chat widget is automatically included on the Dashboard. To use it elsewhere:

```tsx
import { ChatWidget } from "./components/chat";

function MyPage() {
  return (
    <div>
      <ChatWidget companyName="Your Company" position="bottom-right" />
    </div>
  );
}
```

### Important Security Note

⚠️ **Production Warning**: The current implementation uses `dangerouslyAllowBrowser: true` which exposes your API key in the browser.

For production, you should:

1. Create a backend API endpoint
2. Proxy OpenAI requests through your server
3. Keep the API key on the server side only

Example backend endpoint (Node.js/Express):

```javascript
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages,
  });
  res.json(response);
});
```

### Customization

You can customize the chatbot's behavior in `src/lib/openai.ts`:

- **System Prompt**: Edit `createSystemPrompt()` function
- **Temperature**: Adjust creativity (0-1)
- **Max Tokens**: Control response length
- **Model**: Change to `gpt-3.5-turbo` for faster/cheaper responses

### Troubleshooting

**Chat widget not appearing?**

- Check browser console for errors
- Verify VITE_OPENAI_API_KEY is set
- Restart the dev server after adding .env

**API errors?**

- Verify your API key is valid
- Check you have credits/quota available
- Look at browser console for detailed errors

**Styling issues?**

- Ensure Tailwind CSS is properly configured
- Check z-index conflicts with other components
