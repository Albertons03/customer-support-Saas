-- =====================================================
-- Chat Conversations Schema
-- Version: 002 - Chat and AI Features
-- =====================================================
-- 
-- IMPORTANT: This migration requires 001_initial_schema.sql to be run first!
--
-- Dependencies:
-- - public.profiles table must exist
-- - UUID extension must be enabled
-- =====================================================

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  
  -- Customer Information
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_email TEXT,
  customer_name TEXT,
  
  -- Conversation Metadata
  status TEXT DEFAULT 'active' NOT NULL, -- active, closed, escalated
  last_message_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT conversation_status_check CHECK (status IN ('active', 'closed', 'escalated'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_workspace_id ON public.conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON public.conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- =====================================================
-- CONVERSATION MESSAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  
  -- Message Details
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  
  -- Metadata
  tokens_used INTEGER,
  model TEXT, -- e.g., 'gpt-4', 'gpt-3.5-turbo'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT message_role_check CHECK (role IN ('user', 'assistant', 'system'))
);

-- Indexes (renamed to avoid conflicts with 001_initial_schema.sql)
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON public.conversation_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_created ON public.conversation_messages(conversation_id, created_at DESC);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Update conversations.updated_at on message insert
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    updated_at = NOW(),
    last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: Customers can view their own conversations
CREATE POLICY "Customers can view own conversations"
  ON public.conversations
  FOR SELECT
  USING (
    customer_id = auth.uid()
    OR
    customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- Conversations: Agents/Admins can view all conversations in their workspace
CREATE POLICY "Agents/Admins can view workspace conversations"
  ON public.conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND workspace_id = conversations.workspace_id
      AND role IN ('admin', 'agent')
    )
  );

-- Conversations: Anyone can create conversations (for anonymous chat)
CREATE POLICY "Anyone can create conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (true);

-- Conversations: Agents/Admins can update conversations
CREATE POLICY "Agents/Admins can update conversations"
  ON public.conversations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND workspace_id = conversations.workspace_id
      AND role IN ('admin', 'agent')
    )
  );

-- Messages: Users can view messages from their conversations
CREATE POLICY "Users can view conversation messages"
  ON public.conversation_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_messages.conversation_id
      AND (
        customer_id = auth.uid()
        OR
        customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
          AND workspace_id = conversations.workspace_id
          AND role IN ('admin', 'agent')
        )
      )
    )
  );

-- Messages: Users can insert messages to their conversations
CREATE POLICY "Users can create messages"
  ON public.conversation_messages
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get recent messages for a conversation
CREATE OR REPLACE FUNCTION get_conversation_history(
  p_conversation_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  role TEXT,
  content TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.role,
    cm.content,
    cm.created_at
  FROM public.conversation_messages cm
  WHERE cm.conversation_id = p_conversation_id
  ORDER BY cm.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.conversations IS 'Chat conversations between customers and AI/agents';
COMMENT ON TABLE public.conversation_messages IS 'Individual messages within conversations';
COMMENT ON COLUMN public.conversation_messages.role IS 'Message sender: user, assistant (AI), or system';
COMMENT ON COLUMN public.conversation_messages.tokens_used IS 'Number of tokens used for this message (for AI responses)';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
