-- Knowledge Base Articles Table
-- Purpose: Store help articles, documentation, and FAQs for customer self-service
-- Features: Markdown content, categories, publish status, view tracking

-- Create knowledge_base_articles table
CREATE TABLE IF NOT EXISTS knowledge_base_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Markdown content
    category TEXT NOT NULL,
    published BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT kb_article_title_length CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
    CONSTRAINT kb_article_content_length CHECK (char_length(content) >= 10),
    CONSTRAINT kb_article_category_length CHECK (char_length(category) >= 2 AND char_length(category) <= 50)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_kb_articles_workspace ON knowledge_base_articles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON knowledge_base_articles(category);
CREATE INDEX IF NOT EXISTS idx_kb_articles_published ON knowledge_base_articles(published);
CREATE INDEX IF NOT EXISTS idx_kb_articles_created_at ON knowledge_base_articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kb_articles_views ON knowledge_base_articles(views DESC);

-- Full-text search index for title and content
CREATE INDEX IF NOT EXISTS idx_kb_articles_search 
ON knowledge_base_articles 
USING gin(to_tsvector('english', title || ' ' || content));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_kb_article_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kb_article_timestamp
BEFORE UPDATE ON knowledge_base_articles
FOR EACH ROW
EXECUTE FUNCTION update_kb_article_timestamp();

-- RLS Policies for knowledge_base_articles
ALTER TABLE knowledge_base_articles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published articles (for public portal)
CREATE POLICY "kb_articles_public_read" ON knowledge_base_articles
    FOR SELECT
    USING (published = true);

-- Policy: Authenticated users can view all articles in their workspace
CREATE POLICY "kb_articles_workspace_read" ON knowledge_base_articles
    FOR SELECT
    TO authenticated
    USING (
        workspace_id IN (
            SELECT workspace_id 
            FROM profiles 
            WHERE email = (auth.jwt() ->> 'email')::text
            LIMIT 1
        )
    );

-- Policy: Agents and admins can create articles
CREATE POLICY "kb_articles_create" ON knowledge_base_articles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        workspace_id IN (
            SELECT p.workspace_id 
            FROM profiles p
            WHERE p.email = (auth.jwt() ->> 'email')::text
            AND p.role IN ('admin', 'agent')
            LIMIT 1
        )
    );

-- Policy: Agents and admins can update articles in their workspace
CREATE POLICY "kb_articles_update" ON knowledge_base_articles
    FOR UPDATE
    TO authenticated
    USING (
        workspace_id IN (
            SELECT p.workspace_id 
            FROM profiles p
            WHERE p.email = (auth.jwt() ->> 'email')::text
            AND p.role IN ('admin', 'agent')
            LIMIT 1
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT p.workspace_id 
            FROM profiles p
            WHERE p.email = (auth.jwt() ->> 'email')::text
            AND p.role IN ('admin', 'agent')
            LIMIT 1
        )
    );

-- Policy: Admins can delete articles in their workspace
CREATE POLICY "kb_articles_delete" ON knowledge_base_articles
    FOR DELETE
    TO authenticated
    USING (
        workspace_id IN (
            SELECT p.workspace_id 
            FROM profiles p
            WHERE p.email = (auth.jwt() ->> 'email')::text
            AND p.role = 'admin'
            LIMIT 1
        )
    );

-- Function to increment article views (callable by anyone)
CREATE OR REPLACE FUNCTION increment_article_views(article_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE knowledge_base_articles
    SET views = views + 1
    WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search articles (full-text search)
CREATE OR REPLACE FUNCTION search_kb_articles(
    search_query TEXT,
    filter_category TEXT DEFAULT NULL,
    only_published BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    category TEXT,
    published BOOLEAN,
    views INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.content,
        a.category,
        a.published,
        a.views,
        a.created_at,
        a.updated_at,
        ts_rank(to_tsvector('english', a.title || ' ' || a.content), plainto_tsquery('english', search_query)) as rank
    FROM knowledge_base_articles a
    WHERE 
        (NOT only_published OR a.published = true)
        AND (filter_category IS NULL OR a.category = filter_category)
        AND (
            search_query IS NULL 
            OR search_query = ''
            OR to_tsvector('english', a.title || ' ' || a.content) @@ plainto_tsquery('english', search_query)
        )
    ORDER BY rank DESC, a.views DESC, a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION increment_article_views(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_kb_articles(TEXT, TEXT, BOOLEAN) TO anon, authenticated;

-- Insert sample articles for demo
INSERT INTO knowledge_base_articles (workspace_id, title, content, category, published, views, created_by)
SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Getting Started with SupportHub',
    E'# Welcome to SupportHub!\n\n## Introduction\n\nSupportHub is your all-in-one customer support platform. This guide will help you get started.\n\n## Quick Start\n\n1. **Create your account** - Sign up with your email\n2. **Set up your workspace** - Configure your company settings\n3. **Add team members** - Invite agents to join\n4. **Start receiving tickets** - Begin helping customers\n\n## Key Features\n\n- 📧 Email integration\n- 💬 Live chat support\n- 📊 Analytics dashboard\n- 🤖 AI-powered responses\n\n## Need Help?\n\nContact our support team at support@supporthub.com',
    'Getting Started',
    true,
    152,
    (SELECT id FROM profiles LIMIT 1)
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1);

INSERT INTO knowledge_base_articles (workspace_id, title, content, category, published, views, created_by)
SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    'How to Create and Manage Tickets',
    E'# Ticket Management Guide\n\n## Creating a Ticket\n\nThere are several ways to create a ticket:\n\n### Manual Creation\n1. Click the "New Ticket" button\n2. Fill in customer details\n3. Add a subject and description\n4. Assign priority and category\n5. Click "Create"\n\n### Email Integration\nTickets are automatically created from incoming emails.\n\n### Chat Widget\nCustomers can create tickets directly from the chat widget.\n\n## Managing Tickets\n\n- **Change Status**: Click the status dropdown to update\n- **Assign**: Select an agent from the assignee menu\n- **Add Notes**: Use internal notes for team communication\n- **Track Time**: Log time spent on each ticket\n\n## Best Practices\n\n✅ Respond within 24 hours\n✅ Keep customers updated\n✅ Use templates for common issues\n✅ Close tickets promptly',
    'Tickets',
    true,
    87,
    (SELECT id FROM profiles LIMIT 1)
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1);

INSERT INTO knowledge_base_articles (workspace_id, title, content, category, published, views, created_by)
SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Using the AI Chat Assistant',
    E'# AI Chat Assistant\n\n## Overview\n\nOur AI-powered chat assistant helps customers get instant answers to common questions.\n\n## How It Works\n\n1. Customer opens the chat widget\n2. AI analyzes the question\n3. Provides instant, accurate responses\n4. Escalates to human agent when needed\n\n## Features\n\n- **24/7 Availability**: Never miss a customer inquiry\n- **Instant Responses**: No waiting times\n- **Context Aware**: Remembers conversation history\n- **Smart Escalation**: Knows when to involve humans\n\n## Customization\n\nYou can customize:\n- Welcome message\n- Chat widget colors\n- Widget position\n- Response tone\n\n## Analytics\n\nTrack:\n- Total conversations\n- Resolution rate\n- Average response time\n- Customer satisfaction\n\n## Training the AI\n\nThe AI learns from your knowledge base articles. Keep them updated for best results!',
    'AI Assistant',
    true,
    203,
    (SELECT id FROM profiles LIMIT 1)
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1);

INSERT INTO knowledge_base_articles (workspace_id, title, content, category, published, views, created_by)
SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Team Collaboration Features',
    E'# Team Collaboration\n\n## Internal Notes\n\nUse internal notes to communicate with your team without customers seeing:\n\n```\n@mention teammates for notifications\nAdd context and updates\nShare relevant information\n```\n\n## Assignment Rules\n\n- **Round Robin**: Distribute tickets evenly\n- **Skill-based**: Route by expertise\n- **Manual**: Assign directly to agents\n\n## Notifications\n\nStay updated with:\n- Email notifications\n- Browser push notifications\n- Slack integration\n- Mobile app alerts\n\n## Performance Tracking\n\nMonitor team metrics:\n- Response times\n- Resolution rates\n- Customer satisfaction scores\n- Ticket volume per agent',
    'Team Management',
    true,
    45,
    (SELECT id FROM profiles LIMIT 1)
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1);

INSERT INTO knowledge_base_articles (workspace_id, title, content, category, published, views, created_by)
SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Billing and Subscription FAQ',
    E'# Billing FAQ\n\n## Common Questions\n\n### How much does SupportHub cost?\n\nWe offer flexible pricing:\n- **Starter**: $29/month - 1 agent\n- **Professional**: $99/month - 5 agents\n- **Enterprise**: Custom pricing - Unlimited agents\n\n### Can I change my plan?\n\nYes! Upgrade or downgrade anytime. Changes take effect immediately.\n\n### What payment methods do you accept?\n\n- Credit/debit cards\n- PayPal\n- Bank transfer (Enterprise only)\n\n### Is there a free trial?\n\nYes! 14-day free trial, no credit card required.\n\n### What happens if I cancel?\n\nYour data is retained for 30 days. Export anytime before deletion.\n\n### Do you offer refunds?\n\nYes, within 30 days of purchase for any reason.',
    'Billing',
    false,
    12,
    (SELECT id FROM profiles LIMIT 1)
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1);

COMMENT ON TABLE knowledge_base_articles IS 'Help articles and documentation for customer self-service';
COMMENT ON COLUMN knowledge_base_articles.content IS 'Markdown formatted article content';
COMMENT ON COLUMN knowledge_base_articles.published IS 'Only published articles are visible on public portal';
COMMENT ON COLUMN knowledge_base_articles.views IS 'Number of times article has been viewed';
