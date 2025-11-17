# Supabase Database Migration Guide

## ⚠️ **IMPORTANT: Migration Order**

**You MUST run migrations in this order:**

1. **FIRST:** `001_initial_schema.sql` - Creates base tables (profiles, tickets, messages)
2. **SECOND:** `002_chat_conversations.sql` - Creates chat tables (conversations, conversation_messages)

**Running them out of order will cause errors!**

---

## 🚀 How to Apply Migrations

### Method 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://app.supabase.com
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

**Step 1 - Run First Migration:** 4. Copy the **entire content** of `supabase/migrations/001_initial_schema.sql` 5. Paste it into the SQL editor 6. Click **Run** (or press Ctrl+Enter) 7. ✅ Wait for success message: "Success. No rows returned"

**Step 2 - Run Second Migration:** 8. Click **New Query** again 9. Copy the **entire content** of `supabase/migrations/002_chat_conversations.sql` 10. Paste it into the SQL editor 11. Click **Run** 12. ✅ Wait for success message

### Method 2: Supabase CLI

```
┌─────────────────┐
│   auth.users    │ (Supabase Auth)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│    profiles     │ (Extended user info)
│  - id (PK)      │
│  - workspace_id │ ← Multi-tenancy
│  - role         │
└────────┬────────┘
         │
         ↓
┌─────────────────┐         ┌──────────────────┐
│     tickets     │────────→│    messages      │
│  - id (PK)      │         │  - id (PK)       │
│  - workspace_id │         │  - ticket_id (FK)│
│  - customer_id  │         │  - sender_id     │
│  - assigned_to  │         │  - is_internal   │
│  - status       │         └──────────────────┘
│  - priority     │
│  - category     │         ┌──────────────────┐
└────────┬────────┘────────→│ ticket_activities│
         │                  │  - id (PK)       │
         │                  │  - ticket_id (FK)│
         │                  │  - action        │
         └──────────────────│  - user_id       │
                            └──────────────────┘
```

---

## 📋 Tables Detailed

### 1. **profiles** (User Extension)

Extends Supabase's `auth.users` with additional application data.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,              -- Links to auth.users.id
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'customer', -- admin | agent | customer
  workspace_id UUID,                 -- Multi-tenant workspace
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Key Features:**

- Automatically created when user signs up (via trigger)
- Stores role for permissions
- `workspace_id` enables multi-tenancy
- Email validation with CHECK constraint

**Indexes:**

- `idx_profiles_workspace_id` - Fast workspace lookups
- `idx_profiles_email` - Email searches
- `idx_profiles_role` - Role-based queries

---

### 2. **tickets** (Support Tickets)

Main table for customer support tickets.

```sql
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,       -- Multi-tenancy

  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_id UUID,                 -- NULL for guest tickets

  -- Ticket Details
  subject TEXT NOT NULL,            -- 3-200 chars
  description TEXT NOT NULL,        -- Min 10 chars
  status ticket_status,             -- open | in_progress | waiting_customer | resolved | closed
  priority ticket_priority,         -- low | medium | high | urgent
  category ticket_category,         -- technical | billing | feature_request | bug | general

  -- Assignment
  assigned_to UUID,                 -- Agent assigned

  -- Metadata
  tags TEXT[],                      -- Array of tags
  internal_notes TEXT,              -- Notes not visible to customer

  -- Timestamps
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,          -- Auto-set when status = resolved
  closed_at TIMESTAMPTZ             -- Auto-set when status = closed
);
```

**Key Features:**

- **Guest Support**: `customer_id` can be NULL for unauthenticated users
- **Auto Timestamps**: `resolved_at` and `closed_at` auto-set by triggers
- **Tags Array**: PostgreSQL array for flexible tagging
- **Status Flow**: open → in_progress → waiting_customer → resolved → closed

**Indexes:**

- `idx_tickets_workspace_id` - Multi-tenant queries
- `idx_tickets_status` - Filter by status
- `idx_tickets_priority` - Priority sorting
- `idx_tickets_assigned_to` - Agent workload
- `idx_tickets_workspace_status` - Composite for common queries

---

### 3. **messages** (Ticket Messages)

Messages and replies on tickets.

```sql
CREATE TABLE public.messages (
  id UUID PRIMARY KEY,
  ticket_id UUID NOT NULL,          -- Parent ticket

  -- Sender Information
  sender_id UUID,                    -- NULL for guest messages
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,

  -- Content
  content TEXT NOT NULL,             -- 1-10,000 chars
  is_internal BOOLEAN DEFAULT false, -- Internal notes vs customer-visible

  -- Attachments
  attachments JSONB DEFAULT '[]',    -- Array of file metadata

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Key Features:**

- **Internal Notes**: `is_internal = true` for agent-only messages
- **Attachments**: JSONB array stores file URLs and metadata
- **Cascade Delete**: Deletes with parent ticket
- **Edit Window**: Users can edit within 15 minutes (via RLS)

**Indexes:**

- `idx_messages_ticket_id` - Get all messages for a ticket
- `idx_messages_ticket_created` - Chronological ordering

**Attachment Structure:**

```json
[
  {
    "url": "https://storage.supabase.co/...",
    "filename": "screenshot.png",
    "size": 1024,
    "type": "image/png"
  }
]
```

---

### 4. **ticket_activities** (Audit Log)

Tracks all changes to tickets for audit trail.

```sql
CREATE TABLE public.ticket_activities (
  id UUID PRIMARY KEY,
  ticket_id UUID NOT NULL,
  user_id UUID,                      -- Who made the change

  action TEXT NOT NULL,              -- 'created', 'updated', 'assigned', etc.
  field_name TEXT,                   -- Which field changed
  old_value TEXT,                    -- Previous value
  new_value TEXT,                    -- New value

  created_at TIMESTAMPTZ
);
```

**Auto-logged Actions:**

- Status changes
- Assignment changes
- Priority changes
- Triggered automatically (no manual inserts needed)

---

## 🔒 Row Level Security (RLS)

### Why RLS?

RLS ensures users can only access their own data or data within their workspace - **enforced at the database level**, not just application code.

### Policy Architecture

```
┌─────────────────────────────────────────────┐
│           User Authentication               │
│         (Supabase Auth Token)               │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│          RLS Policy Evaluation               │
│  • Check user role (admin/agent/customer)   │
│  • Check workspace_id match                 │
│  • Apply appropriate permissions            │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│          Data Access Granted/Denied          │
└─────────────────────────────────────────────┘
```

---

### Profiles Policies

**1. Users can view own profile**

```sql
auth.uid() = id
```

**2. Users can update own profile**

```sql
auth.uid() = id
```

**3. Admins/Agents can view workspace profiles**

```sql
-- Only if user is admin/agent in same workspace
EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid()
  AND workspace_id = profiles.workspace_id
  AND role IN ('admin', 'agent')
)
```

---

### Tickets Policies

**1. Customers can view own tickets**

```sql
customer_id = auth.uid()
OR
customer_email = (SELECT email FROM profiles WHERE id = auth.uid())
```

**2. Admins/Agents can view workspace tickets**

```sql
EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid()
  AND workspace_id = tickets.workspace_id
  AND role IN ('admin', 'agent')
)
```

**3. Everyone can create tickets** (authenticated or guest)

**4. Only Admins/Agents can update tickets**

**5. Only Admins can delete tickets**

---

### Messages Policies

**1. Customers see only non-internal messages**

```sql
-- Customer can see their ticket messages (excluding internal)
EXISTS (SELECT 1 FROM tickets WHERE customer_id = auth.uid())
AND is_internal = false
```

**2. Agents/Admins see all messages** (including internal)

**3. 15-minute edit window** for own messages

```sql
sender_id = auth.uid()
AND created_at > (NOW() - INTERVAL '15 minutes')
```

---

## 🔄 Triggers & Automation

### 1. **Auto-update `updated_at`**

Automatically updates timestamp on any record change:

```sql
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. **Auto-create Profile on Signup**

When a user signs up via Supabase Auth, automatically create profile:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  EXECUTE FUNCTION handle_new_user();
```

### 3. **Log Ticket Changes**

Automatically logs to `ticket_activities`:

```sql
-- Logs status changes
IF OLD.status != NEW.status THEN
  INSERT INTO ticket_activities (...)
END IF;
```

**Auto-logged:**

- Status changes
- Assignment changes
- Priority changes
- Sets `resolved_at` when resolved
- Sets `closed_at` when closed

---

## 🚀 How to Apply Migration

### Method 1: Supabase Dashboard (Easiest)

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy entire contents of `001_initial_schema.sql`
5. Paste and click **Run**
6. Verify success in **Table Editor**

### Method 2: Supabase CLI

```bash
# Make sure you're in the project root
cd customer-support-saas

# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations in order
supabase db push
```

---

## ✅ Verify Migrations Succeeded

After running **both** migrations, verify in Supabase Dashboard → **Table Editor**:

**From Migration 001:**

- ✅ `profiles` - User profiles with roles
- ✅ `tickets` - Support tickets
- ✅ `messages` - Ticket messages
- ✅ `ticket_activities` - Audit log

**From Migration 002:**

- ✅ `conversations` - Chat conversations (NEW)
- ✅ `conversation_messages` - Chat messages (NEW)

### Verify via SQL:

```sql
-- List all tables
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Should show: conversations, conversation_messages, messages,
--              profiles, ticket_activities, tickets
```

---

## ❌ Common Errors & Solutions

### Error: `relation "public.profiles" does not exist`

**Cause:** You tried to run `002_chat_conversations.sql` BEFORE `001_initial_schema.sql`

**Solution:**

1. Run `001_initial_schema.sql` first
2. Then run `002_chat_conversations.sql`

### Error: `relation "public.conversations" already exists`

**Cause:** Migration already run successfully

**Solution:** If you need to re-run the migration:

```sql
-- Drop chat tables
DROP TABLE IF EXISTS public.conversation_messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- Then re-run 002_chat_conversations.sql
```

### Error: `extension "uuid-ossp" does not exist`

**Solution:** Run this first in SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 🗄️ Database Schema

### Complete Architecture Diagram

```
┌─────────────────┐
│   auth.users    │ (Supabase Auth)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│    profiles     │ (Extended user info)
│  - id (PK)      │
│  - workspace_id │ ← Multi-tenancy
│  - role         │
└────────┬────────┘
         │
         ├──────────────────────────────┐
         │                              │
         ↓                              ↓
┌─────────────────┐         ┌──────────────────┐
│     tickets     │────────→│    messages      │
│  - id (PK)      │         │  - id (PK)       │
│  - workspace_id │         │  - ticket_id (FK)│
│  - customer_id  │         │  - sender_id     │
│  - assigned_to  │         │  - is_internal   │
│  - status       │         └──────────────────┘
│  - priority     │
│  - category     │         ┌──────────────────┐
└────────┬────────┘────────→│ ticket_activities│
         │                  │  - id (PK)       │
         │                  │  - ticket_id (FK)│
         │                  │  - action        │
         │                  └──────────────────┘
         │
         ↓
┌─────────────────┐         ┌──────────────────────┐
│ conversations   │────────→│ conversation_messages│
│  - id (PK)      │         │  - id (PK)           │
│  - workspace_id │         │  - conversation_id   │
│  - customer_id  │         │  - role (user/AI)    │
│  - status       │         │  - content           │
└─────────────────┘         │  - model (gpt-4)     │
                            └──────────────────────┘
```

## 📊 Sample Queries

### Get all open tickets for a workspace

```sql
SELECT * FROM tickets
WHERE workspace_id = 'your-workspace-id'
AND status = 'open'
ORDER BY priority DESC, created_at DESC;
```

### Get ticket with all messages

```sql
SELECT
  t.*,
  json_agg(m.*) as messages
FROM tickets t
LEFT JOIN messages m ON m.ticket_id = t.id
WHERE t.id = 'ticket-id'
GROUP BY t.id;
```

### Get ticket statistics

```sql
SELECT * FROM get_ticket_stats('your-workspace-id');
```

### Get agent workload

```sql
SELECT
  p.full_name,
  COUNT(*) FILTER (WHERE t.status = 'open') as open_tickets,
  COUNT(*) FILTER (WHERE t.status = 'in_progress') as in_progress_tickets
FROM profiles p
LEFT JOIN tickets t ON t.assigned_to = p.id
WHERE p.role = 'agent'
AND p.workspace_id = 'your-workspace-id'
GROUP BY p.id, p.full_name;
```

---

## 🔐 Security Best Practices

### 1. **Never Bypass RLS**

Always use authenticated requests. RLS is enforced at database level.

### 2. **Use Service Role Sparingly**

Service role key bypasses RLS - only use for admin operations.

### 3. **Validate Input**

Even with constraints, validate in application:

```typescript
// Client-side validation before DB insert
if (subject.length < 3 || subject.length > 200) {
  throw new Error("Invalid subject length");
}
```

### 4. **Workspace Isolation**

Always include `workspace_id` in multi-tenant queries.

---

## 🎯 Multi-Tenancy Model

### How it Works:

1. **Workspace Assignment**: Each user has a `workspace_id`
2. **RLS Enforcement**: Policies check `workspace_id` match
3. **Data Isolation**: Users only see their workspace data

### Example Flow:

```
User A (workspace: abc-123)
  ↓
Queries tickets table
  ↓
RLS Policy checks: user.workspace_id == ticket.workspace_id
  ↓
Returns only tickets where workspace_id = 'abc-123'
```

---

## 📈 Performance Optimizations

### Indexes Created:

- **Single-column**: Fast lookups on common filters
- **Composite**: Optimized for frequent query patterns
- **Descending**: Chronological ordering (newest first)

### Query Tips:

**✅ Good:**

```sql
-- Uses index
SELECT * FROM tickets
WHERE workspace_id = 'xxx' AND status = 'open';
```

**❌ Avoid:**

```sql
-- Full table scan
SELECT * FROM tickets
WHERE LOWER(subject) LIKE '%keyword%';
```

**✅ Better:**

```sql
-- Use full-text search
SELECT * FROM tickets
WHERE subject ILIKE 'keyword%';
```

---

## 🔄 TypeScript Integration

Update your `src/types/database.ts` to match schema:

```typescript
export interface Database {
  public: {
    Tables: {
      tickets: {
        Row: {
          id: string;
          workspace_id: string;
          customer_name: string;
          customer_email: string;
          customer_id: string | null;
          subject: string;
          description: string;
          status:
            | "open"
            | "in_progress"
            | "waiting_customer"
            | "resolved"
            | "closed";
          priority: "low" | "medium" | "high" | "urgent";
          category:
            | "technical"
            | "billing"
            | "feature_request"
            | "bug"
            | "general";
          assigned_to: string | null;
          tags: string[];
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
          closed_at: string | null;
        };
        Insert: {
          // Fields required for insert
          workspace_id: string;
          customer_name: string;
          customer_email: string;
          subject: string;
          description: string;
          // Optional fields
          customer_id?: string;
          status?:
            | "open"
            | "in_progress"
            | "waiting_customer"
            | "resolved"
            | "closed";
          priority?: "low" | "medium" | "high" | "urgent";
          category?:
            | "technical"
            | "billing"
            | "feature_request"
            | "bug"
            | "general";
          assigned_to?: string;
          tags?: string[];
        };
        Update: {
          // All fields optional for updates
          subject?: string;
          status?:
            | "open"
            | "in_progress"
            | "waiting_customer"
            | "resolved"
            | "closed";
          // ... etc
        };
      };
      messages: {
        // Similar structure
      };
    };
  };
}
```

---

## 🐛 Troubleshooting

### Issue: RLS blocking legitimate queries

**Solution:** Check policies with:

```sql
SELECT * FROM pg_policies WHERE tablename = 'tickets';
```

### Issue: Trigger not firing

**Solution:** Verify trigger exists:

```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%ticket%';
```

### Issue: Slow queries

**Solution:** Check index usage:

```sql
EXPLAIN ANALYZE
SELECT * FROM tickets WHERE workspace_id = 'xxx';
```

---

## 📚 Next Steps

1. **Apply Migration** - Run the SQL script
2. **Test RLS** - Try queries with different user roles
3. **Seed Data** - Add test tickets and messages
4. **Update TypeScript Types** - Match database schema
5. **Build API Layer** - Create Supabase client functions

Your database is now production-ready with:

- ✅ Full multi-tenancy support
- ✅ Row-level security
- ✅ Audit logging
- ✅ Performance indexes
- ✅ Automated triggers

Happy building! 🚀
