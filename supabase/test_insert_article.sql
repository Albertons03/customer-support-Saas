-- Test: Insert a simple article without checking for existing profiles
-- Run this in Supabase SQL Editor to create test data

INSERT INTO knowledge_base_articles (
    workspace_id, 
    title, 
    content, 
    category, 
    published, 
    views
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Test Article - Getting Started',
    E'# Welcome to Knowledge Base\n\n## Introduction\n\nThis is a test article to verify the knowledge base is working.\n\n## Features\n\n- Create articles\n- Edit content\n- Publish/unpublish\n- Search and filter\n\n## Next Steps\n\nTry creating your own article!',
    'Getting Started',
    true,
    0
);

-- Insert a few more test articles
INSERT INTO knowledge_base_articles (workspace_id, title, content, category, published, views) VALUES
    ('00000000-0000-0000-0000-000000000001'::uuid, 'How to Use Tickets', E'# Ticket System\n\nLearn how to manage tickets effectively.\n\n## Create a Ticket\n1. Click New Ticket\n2. Fill in details\n3. Submit', 'Tickets', true, 5),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'AI Chat Features', E'# AI Assistant\n\nOur AI can help answer common questions.\n\n## Benefits\n- 24/7 availability\n- Instant responses\n- Smart escalation', 'AI Assistant', true, 10),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'Draft Article', E'# Work in Progress\n\nThis article is not yet published.', 'Other', false, 0);

-- Verify the data
SELECT id, title, category, published, views, created_at 
FROM knowledge_base_articles 
ORDER BY created_at DESC;
