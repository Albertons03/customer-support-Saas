// Database types
export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role: "admin" | "agent" | "customer";
  workspace_id?: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageAttachment {
  url: string;
  filename: string;
  size: number;
  type: string;
}

export interface Ticket {
  id: string;
  workspace_id: string;
  customer_name: string;
  customer_email: string;
  customer_id?: string | null;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: "technical" | "billing" | "feature_request" | "bug" | "general";
  assigned_to?: string | null;
  tags: string[];
  internal_notes?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  closed_at?: string | null;
}

export interface Message {
  id: string;
  ticket_id: string;
  sender_id?: string | null;
  sender_name: string;
  sender_email: string;
  content: string;
  is_internal: boolean;
  attachments?: MessageAttachment[];
  created_at: string;
  updated_at: string;
}

export interface TicketActivity {
  id: string;
  ticket_id: string;
  user_id?: string | null;
  action: string;
  field_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  created_at: string;
}

// Chat conversation types
export interface Conversation {
  id: string;
  workspace_id: string;
  customer_id?: string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  status: "active" | "closed" | "escalated";
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokens_used?: number | null;
  model?: string | null;
  created_at: string;
}
