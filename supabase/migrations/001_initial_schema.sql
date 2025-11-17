-- =====================================================
-- Customer Support SaaS - Database Migration
-- Version: 001 - Initial Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CUSTOM TYPES
-- =====================================================

-- Ticket Status Enum
CREATE TYPE ticket_status AS ENUM (
  'open',
  'in_progress',
  'waiting_customer',
  'resolved',
  'closed'
);

-- Ticket Priority Enum
CREATE TYPE ticket_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Ticket Category Enum
CREATE TYPE ticket_category AS ENUM (
  'technical',
  'billing',
  'feature_request',
  'bug',
  'general'
);

-- User Role Enum
CREATE TYPE user_role AS ENUM (
  'admin',
  'agent',
  'customer'
);

-- =====================================================
-- PROFILES TABLE (extends auth.users)
-- =====================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'customer' NOT NULL,
  workspace_id UUID, -- For multi-tenancy
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Index for faster lookups
CREATE INDEX idx_profiles_workspace_id ON public.profiles(workspace_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- =====================================================
-- TICKETS TABLE
-- =====================================================

CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,

  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Ticket Details
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status ticket_status DEFAULT 'open' NOT NULL,
  priority ticket_priority DEFAULT 'medium' NOT NULL,
  category ticket_category DEFAULT 'general' NOT NULL,

  -- Assignment
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  internal_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT customer_email_format CHECK (customer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT subject_length CHECK (char_length(subject) >= 3 AND char_length(subject) <= 200),
  CONSTRAINT description_length CHECK (char_length(description) >= 10)
);

-- Indexes for performance
CREATE INDEX idx_tickets_workspace_id ON public.tickets(workspace_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_priority ON public.tickets(priority);
CREATE INDEX idx_tickets_category ON public.tickets(category);
CREATE INDEX idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX idx_tickets_customer_email ON public.tickets(customer_email);
CREATE INDEX idx_tickets_created_at ON public.tickets(created_at DESC);
CREATE INDEX idx_tickets_updated_at ON public.tickets(updated_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_tickets_workspace_status ON public.tickets(workspace_id, status);
CREATE INDEX idx_tickets_workspace_assigned ON public.tickets(workspace_id, assigned_to);

-- =====================================================
-- MESSAGES TABLE
-- =====================================================

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,

  -- Sender Information
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,

  -- Message Content
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false NOT NULL, -- Internal notes vs customer-facing

  -- Attachments (URLs to uploaded files)
  attachments JSONB DEFAULT '[]'::JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 10000),
  CONSTRAINT sender_email_format CHECK (sender_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Indexes for performance
CREATE INDEX idx_messages_ticket_id ON public.messages(ticket_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_is_internal ON public.messages(is_internal);

-- Composite index for common queries
CREATE INDEX idx_messages_ticket_created ON public.messages(ticket_id, created_at DESC);

-- =====================================================
-- TICKET ACTIVITY LOG (for audit trail)
-- =====================================================

CREATE TABLE public.ticket_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Activity Details
  action TEXT NOT NULL, -- 'created', 'updated', 'assigned', 'status_changed', etc.
  field_name TEXT, -- Which field was changed
  old_value TEXT, -- Previous value
  new_value TEXT, -- New value

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_ticket_activities_ticket_id ON public.ticket_activities(ticket_id);
CREATE INDEX idx_ticket_activities_created_at ON public.ticket_activities(created_at DESC);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to log ticket changes
CREATE OR REPLACE FUNCTION log_ticket_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.ticket_activities (ticket_id, user_id, action, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status_changed', 'status', OLD.status::TEXT, NEW.status::TEXT);
  END IF;

  -- Log assignment changes
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO public.ticket_activities (ticket_id, user_id, action, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'assigned', 'assigned_to', OLD.assigned_to::TEXT, NEW.assigned_to::TEXT);
  END IF;

  -- Log priority changes
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO public.ticket_activities (ticket_id, user_id, action, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'priority_changed', 'priority', OLD.priority::TEXT, NEW.priority::TEXT);
  END IF;

  -- Update resolved_at when status becomes resolved
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;

  -- Update closed_at when status becomes closed
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply ticket change trigger
CREATE TRIGGER log_ticket_changes
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_change();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES RLS POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admins and agents can view all profiles in their workspace
CREATE POLICY "Admins/Agents can view workspace profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND workspace_id = profiles.workspace_id
      AND role IN ('admin', 'agent')
    )
  );

-- =====================================================
-- TICKETS RLS POLICIES
-- =====================================================

-- Customers can view their own tickets
CREATE POLICY "Customers can view own tickets"
  ON public.tickets
  FOR SELECT
  USING (
    customer_id = auth.uid()
    OR
    customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- Admins and agents can view all tickets in their workspace
CREATE POLICY "Admins/Agents can view workspace tickets"
  ON public.tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND workspace_id = tickets.workspace_id
      AND role IN ('admin', 'agent')
    )
  );

-- Customers can create tickets
CREATE POLICY "Customers can create tickets"
  ON public.tickets
  FOR INSERT
  WITH CHECK (
    customer_id = auth.uid()
    OR
    customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- Admins and agents can create tickets
CREATE POLICY "Admins/Agents can create tickets"
  ON public.tickets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND workspace_id = tickets.workspace_id
      AND role IN ('admin', 'agent')
    )
  );

-- Admins and agents can update tickets in their workspace
CREATE POLICY "Admins/Agents can update workspace tickets"
  ON public.tickets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND workspace_id = tickets.workspace_id
      AND role IN ('admin', 'agent')
    )
  );

-- Admins can delete tickets
CREATE POLICY "Admins can delete tickets"
  ON public.tickets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND workspace_id = tickets.workspace_id
      AND role = 'admin'
    )
  );

-- =====================================================
-- MESSAGES RLS POLICIES
-- =====================================================

-- Users can view messages for tickets they have access to
CREATE POLICY "Users can view accessible ticket messages"
  ON public.messages
  FOR SELECT
  USING (
    -- Customer can see their own ticket messages (excluding internal)
    (
      EXISTS (
        SELECT 1 FROM public.tickets t
        WHERE t.id = messages.ticket_id
        AND (t.customer_id = auth.uid() OR t.customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
      )
      AND is_internal = false
    )
    OR
    -- Agents/Admins can see all messages in their workspace tickets
    EXISTS (
      SELECT 1 FROM public.tickets t
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE t.id = messages.ticket_id
      AND t.workspace_id = p.workspace_id
      AND p.role IN ('admin', 'agent')
    )
  );

-- Users can create messages for accessible tickets
CREATE POLICY "Users can create messages for accessible tickets"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    -- Customer can create messages on their tickets
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = messages.ticket_id
      AND (t.customer_id = auth.uid() OR t.customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    )
    OR
    -- Agents/Admins can create messages on workspace tickets
    EXISTS (
      SELECT 1 FROM public.tickets t
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE t.id = messages.ticket_id
      AND t.workspace_id = p.workspace_id
      AND p.role IN ('admin', 'agent')
    )
  );

-- Only sender can update their own messages (within 15 minutes)
CREATE POLICY "Users can update own recent messages"
  ON public.messages
  FOR UPDATE
  USING (
    sender_id = auth.uid()
    AND created_at > (NOW() - INTERVAL '15 minutes')
  );

-- Admins can delete messages
CREATE POLICY "Admins can delete messages"
  ON public.messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE t.id = messages.ticket_id
      AND t.workspace_id = p.workspace_id
      AND p.role = 'admin'
    )
  );

-- =====================================================
-- TICKET ACTIVITIES RLS POLICIES
-- =====================================================

-- Agents/Admins can view activities for their workspace tickets
CREATE POLICY "Agents/Admins can view workspace ticket activities"
  ON public.ticket_activities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE t.id = ticket_activities.ticket_id
      AND t.workspace_id = p.workspace_id
      AND p.role IN ('admin', 'agent')
    )
  );

-- System can insert activities (handled by triggers)
CREATE POLICY "System can insert activities"
  ON public.ticket_activities
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS FOR APPLICATION
-- =====================================================

-- Function to get ticket statistics
CREATE OR REPLACE FUNCTION get_ticket_stats(p_workspace_id UUID)
RETURNS TABLE (
  total_tickets BIGINT,
  open_tickets BIGINT,
  in_progress_tickets BIGINT,
  resolved_tickets BIGINT,
  urgent_tickets BIGINT,
  avg_resolution_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_tickets,
    COUNT(*) FILTER (WHERE status = 'open')::BIGINT as open_tickets,
    COUNT(*) FILTER (WHERE status = 'in_progress')::BIGINT as in_progress_tickets,
    COUNT(*) FILTER (WHERE status = 'resolved')::BIGINT as resolved_tickets,
    COUNT(*) FILTER (WHERE priority = 'urgent')::BIGINT as urgent_tickets,
    AVG(resolved_at - created_at) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_time
  FROM public.tickets
  WHERE workspace_id = p_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INITIAL DATA (Optional)
-- =====================================================

-- Note: Uncomment and customize if you want to seed initial data
/*
-- Insert sample workspace
INSERT INTO public.profiles (id, email, full_name, role, workspace_id)
VALUES
  (uuid_generate_v4(), 'admin@example.com', 'Admin User', 'admin', uuid_generate_v4());
*/

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.profiles IS 'Extended user profiles with role and workspace information';
COMMENT ON TABLE public.tickets IS 'Customer support tickets with full lifecycle tracking';
COMMENT ON TABLE public.messages IS 'Messages/replies on tickets, can be internal or customer-facing';
COMMENT ON TABLE public.ticket_activities IS 'Audit log of all ticket changes';

COMMENT ON COLUMN public.tickets.workspace_id IS 'Multi-tenant workspace identifier';
COMMENT ON COLUMN public.tickets.customer_id IS 'Reference to registered user, NULL for guest submissions';
COMMENT ON COLUMN public.messages.is_internal IS 'True for internal notes, false for customer-visible messages';
COMMENT ON COLUMN public.messages.attachments IS 'JSON array of attachment URLs and metadata';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
