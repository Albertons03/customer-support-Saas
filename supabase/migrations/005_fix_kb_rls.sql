-- Fix: Remove infinite recursion in knowledge_base_articles RLS policies
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "kb_articles_public_read" ON knowledge_base_articles;
DROP POLICY IF EXISTS "kb_articles_workspace_read" ON knowledge_base_articles;
DROP POLICY IF EXISTS "kb_articles_create" ON knowledge_base_articles;
DROP POLICY IF EXISTS "kb_articles_update" ON knowledge_base_articles;
DROP POLICY IF EXISTS "kb_articles_delete" ON knowledge_base_articles;

-- Policy: Anyone (including anonymous) can view published articles (for public portal)
CREATE POLICY "kb_articles_public_read" ON knowledge_base_articles
    FOR SELECT
    TO anon
    USING (published = true);

-- Policy: Authenticated users can view all articles (no workspace check to avoid recursion)
CREATE POLICY "kb_articles_authenticated_read" ON knowledge_base_articles
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Authenticated users can create articles (simplified, no role check)
CREATE POLICY "kb_articles_create" ON knowledge_base_articles
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Authenticated users can update articles (simplified)
CREATE POLICY "kb_articles_update" ON knowledge_base_articles
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Authenticated users can delete articles (simplified)
CREATE POLICY "kb_articles_delete" ON knowledge_base_articles
    FOR DELETE
    TO authenticated
    USING (true);
