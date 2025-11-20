# 🚀 Supabase Edge Function Deployment Guide

## Overview

This guide explains how to deploy the AI Chat Edge Function to Supabase for secure OpenAI API handling with rate limiting and usage tracking.

---

## 📋 Prerequisites

1. **Supabase CLI installed**

   ```powershell
   # Install via npm
   npm install -g supabase

   # Or via Scoop (Windows)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

2. **Supabase Project** - You already have one at `https://zthibjgjsuyovieipddd.supabase.co`

3. **OpenAI API Key** - Already set in `.env` file

---

## 🔧 Setup Steps

### 1. Login to Supabase CLI

```powershell
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref zthibjgjsuyovieipddd
```

### 2. Apply Database Migration

First, run the AI usage tracking migration in Supabase SQL Editor:

```sql
-- Go to: https://supabase.com/dashboard/project/zthibjgjsuyovieipddd/sql
-- Run: supabase/migrations/006_ai_usage_tracking.sql
```

Or via CLI:

```powershell
supabase db push
```

### 3. Set Environment Secrets

Set your OpenAI API key as a Supabase secret:

```powershell
# Set OpenAI API key
supabase secrets set OPENAI_API_KEY=your_actual_openai_api_key_here

# Verify secrets
supabase secrets list
```

**⚠️ IMPORTANT:** Replace `your_actual_openai_api_key_here` with your actual OpenAI API key.

### 4. Deploy Edge Function

```powershell
# Deploy the ai-chat function
supabase functions deploy ai-chat

# Verify deployment
supabase functions list
```

---

## 🧪 Testing the Edge Function

### Test via CLI

```powershell
# Get your access token from Supabase Dashboard
# Dashboard -> Settings -> API -> anon/service_role key

supabase functions invoke ai-chat \
  --header "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  --body '{"messages":[{"role":"system","content":"You are a helpful assistant."},{"role":"user","content":"Hello!"}]}'
```

### Test via React App

The ChatWidget component is already configured to use the Edge Function. Just:

1. Run `npm run dev`
2. Open chat widget
3. Send a message
4. Check browser console for any errors

---

## 📊 Monitor Usage

### Via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/zthibjgjsuyovieipddd/editor
2. Query `ai_usage` table:
   ```sql
   SELECT * FROM ai_usage ORDER BY created_at DESC LIMIT 10;
   ```

### Via Helper Functions

```typescript
import {
  getUserRateLimit,
  getWorkspaceMonthlyQuota,
  getUsageStats,
} from "@/lib/aiEdgeFunction";

// Check user's rate limit
const rateLimit = await getUserRateLimit();
console.log("Requests remaining:", rateLimit.requests_remaining);

// Check workspace quota
const quota = await getWorkspaceMonthlyQuota();
console.log("Tokens remaining:", quota.tokens_remaining);

// Get usage stats
const stats = await getUsageStats("workspace-id", 30);
console.log("Last 30 days usage:", stats);
```

---

## 🔒 Security Features

### ✅ Rate Limiting

- **20 requests per hour** per user
- Automatically enforced by Edge Function
- Returns `429` status with `retryAfter` seconds

### ✅ Monthly Quota

- **1 million tokens per workspace** per month (~$2)
- Prevents unexpected costs
- Returns `429` status when exceeded

### ✅ API Key Security

- OpenAI API key stored as Supabase secret (not in frontend)
- Only accessible by Edge Function
- Never exposed to client

### ✅ Authentication

- Requires valid Supabase session token
- User must be authenticated
- Validates on every request

---

## 📈 Usage Tracking

The Edge Function automatically logs:

- ✅ Token count (prompt + completion)
- ✅ Cost estimate (based on model pricing)
- ✅ User ID
- ✅ Workspace ID
- ✅ Conversation ID
- ✅ Timestamp

Query usage:

```sql
-- Total tokens used this month
SELECT
  SUM(token_count) as total_tokens,
  SUM(cost_estimate) as total_cost
FROM ai_usage
WHERE workspace_id = '00000000-0000-0000-0000-000000000001'
  AND created_at >= DATE_TRUNC('month', NOW());

-- Top users by usage
SELECT
  user_id,
  COUNT(*) as request_count,
  SUM(token_count) as total_tokens
FROM ai_usage
GROUP BY user_id
ORDER BY total_tokens DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Edge Function Not Found

```
Error: Function not found
```

**Solution:** Re-deploy the function

```powershell
supabase functions deploy ai-chat
```

### Authentication Error

```
Error: Invalid authorization token
```

**Solution:** Make sure user is logged in and token is valid

```typescript
const {
  data: { session },
} = await supabase.auth.getSession();
if (!session) {
  // Redirect to login
}
```

### Rate Limit Exceeded

```
Error: Rate limit exceeded. Maximum 20 requests per hour.
```

**Solution:** Wait for the retry period or increase limit in Edge Function

### Monthly Quota Exceeded

```
Error: Monthly AI quota exceeded (1M tokens)
```

**Solution:**

1. Wait until next month
2. Increase quota in Edge Function
3. Add billing/payment system

### OpenAI API Error

```
Error: OpenAI API error
```

**Solution:**

1. Check OpenAI API key is valid
2. Verify you have credits
3. Check Supabase logs:
   ```powershell
   supabase functions logs ai-chat
   ```

---

## 📝 Edge Function Logs

View real-time logs:

```powershell
# Watch logs in real-time
supabase functions logs ai-chat --follow

# View last 100 logs
supabase functions logs ai-chat --limit 100
```

Or via dashboard:
https://supabase.com/dashboard/project/zthibjgjsuyovieipddd/functions

---

## 🔄 Update Edge Function

After making changes to `supabase/functions/ai-chat/index.ts`:

```powershell
# Re-deploy
supabase functions deploy ai-chat

# Verify
supabase functions invoke ai-chat --method OPTIONS
```

---

## 💰 Cost Estimation

### GPT-3.5-turbo Pricing

- **Input:** $0.0015 per 1K tokens
- **Output:** $0.002 per 1K tokens
- **Average:** ~$0.002 per 1K tokens

### Monthly Quota (1M tokens)

- **Max Cost:** ~$2/month
- **~500,000 messages** (assuming 2K tokens per conversation)
- **~17,000 messages/day**

### Increase Quota (if needed)

Edit `supabase/functions/ai-chat/index.ts`:

```typescript
// Change from 1M to 5M tokens
if (totalTokens > 5000000) {
  // Now allows ~$10/month
}
```

---

## ✅ Checklist

- [ ] Supabase CLI installed
- [ ] Logged in to Supabase
- [ ] Project linked
- [ ] Migration 006 applied
- [ ] OpenAI API key set as secret
- [ ] Edge Function deployed
- [ ] ChatWidget updated to use Edge Function
- [ ] Tested in browser
- [ ] Monitoring usage

---

## 🎯 Next Steps

After deployment:

1. Test chat widget thoroughly
2. Monitor usage in first week
3. Adjust rate limits if needed
4. Add usage dashboard to admin panel
5. Set up alerts for high usage

---

## 📚 Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [Rate Limiting Best Practices](https://supabase.com/docs/guides/functions/rate-limits)
