-- =====================================================
-- Fix RLS Policies - Remove Infinite Recursion
-- Version: 003 - Bug Fixes
-- =====================================================

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Customers can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Agents/Admins can view workspace conversations" ON public.conversations;
DROP POLICY IF EXISTS "Agents/Admins can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversation messages" ON public.conversation_messages;

-- Recreate with simpler, non-recursive policies

-- Conversations: Customers can view their own (by email, no recursion)
CREATE POLICY "Customers can view own conversations"
  ON public.conversations
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = customer_email
  );

-- Conversations: Admins/Agents can view all (simplified)
CREATE POLICY "Agents can view all conversations"
  ON public.conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'agent')
      LIMIT 1
    )
  );

-- Conversations: Admins/Agents can update
CREATE POLICY "Agents can update conversations"
  ON public.conversations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'agent')
      LIMIT 1
    )
  );

-- Messages: Simplified view policy
CREATE POLICY "Users can view conversation messages"
  ON public.conversation_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_messages.conversation_id
      AND (
        c.customer_email = (auth.jwt() ->> 'email')
        OR
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
          AND p.role IN ('admin', 'agent')
          LIMIT 1
        )
      )
    )
  );

-- =====================================================
-- END OF MIGRATION
-- =====================================================
