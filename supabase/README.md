# Supabase Database Migrations

This folder contains all database migrations and related documentation for the Customer Support SaaS platform.

## 📁 Files

- **`migrations/001_initial_schema.sql`** - Complete database schema
- **`MIGRATION_GUIDE.md`** - Comprehensive guide with examples

## 🚀 Quick Start

### Apply Migration to Supabase

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Navigate to SQL Editor

2. **Run Migration**
   - Click "New Query"
   - Copy contents of `migrations/001_initial_schema.sql`
   - Paste and click "Run"

3. **Verify**
   - Go to Table Editor
   - You should see: `profiles`, `tickets`, `messages`, `ticket_activities`

## 📊 Database Schema Overview

### Tables Created

| Table | Purpose | Key Features |
|-------|---------|--------------|
| **profiles** | User profiles | Extends auth.users, stores role & workspace |
| **tickets** | Support tickets | Multi-tenant, status tracking, auto-timestamps |
| **messages** | Ticket messages | Internal notes, attachments, cascade delete |
| **ticket_activities** | Audit log | Auto-logged changes, compliance ready |

### Custom Types (ENUMs)

- `ticket_status` - open, in_progress, waiting_customer, resolved, closed
- `ticket_priority` - low, medium, high, urgent
- `ticket_category` - technical, billing, feature_request, bug, general
- `user_role` - admin, agent, customer

## 🔒 Security Features

✅ **Row Level Security (RLS)** enabled on all tables
✅ **Multi-tenant isolation** via workspace_id
✅ **Role-based permissions** (admin, agent, customer)
✅ **Audit logging** of all ticket changes
✅ **Email validation** with CHECK constraints
✅ **Input length limits** for security

## ⚡ Performance Features

✅ **12+ indexes** for fast queries
✅ **Composite indexes** for common query patterns
✅ **Automatic timestamp updates** via triggers
✅ **Optimized for workspace queries**

## 📖 Documentation

See **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** for:
- Detailed table schemas
- RLS policy explanations
- Sample queries
- TypeScript integration
- Troubleshooting guide
- Security best practices

## 🔧 Helper Functions

Included in migration:

```sql
-- Get ticket statistics for a workspace
SELECT * FROM get_ticket_stats('workspace-id');

-- Returns:
-- - total_tickets
-- - open_tickets
-- - in_progress_tickets
-- - resolved_tickets
-- - urgent_tickets
-- - avg_resolution_time
```

## 📝 Example Usage

### Create a Ticket

```typescript
const { data, error } = await supabase
  .from('tickets')
  .insert({
    workspace_id: 'your-workspace-id',
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    subject: 'Login issue',
    description: 'Cannot login to my account',
    priority: 'high',
    category: 'technical'
  })
```

### Add Message to Ticket

```typescript
const { data, error } = await supabase
  .from('messages')
  .insert({
    ticket_id: 'ticket-id',
    sender_id: user.id,
    sender_name: user.full_name,
    sender_email: user.email,
    content: 'We are looking into this issue',
    is_internal: false // customer can see this
  })
```

## 🎯 Multi-Tenancy

All data is isolated by `workspace_id`:

- **Admins/Agents**: See only their workspace data
- **Customers**: See only their own tickets
- **Enforced at database level** via RLS

## 🔄 Migration History

| Version | Date | Description |
|---------|------|-------------|
| 001 | Initial | Complete schema with RLS and triggers |

## ⚠️ Important Notes

1. **RLS is enabled** - All queries must be authenticated
2. **Workspace required** - Always include workspace_id
3. **Auto-creation** - Profiles auto-created on user signup
4. **Audit trail** - ticket_activities logs all changes
5. **Cascade deletes** - Deleting ticket deletes messages

## 🆘 Need Help?

- Check **MIGRATION_GUIDE.md** for detailed docs
- Review RLS policies in Supabase Dashboard → Authentication → Policies
- Check triggers in SQL Editor: `SELECT * FROM pg_trigger;`
- View indexes: `\di` in psql

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Multi-Tenancy Patterns](https://supabase.com/docs/guides/auth/row-level-security)
