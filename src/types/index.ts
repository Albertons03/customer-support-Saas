// Database types
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  user_id: string
  assigned_to?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  ticket_id: string
  user_id: string
  content: string
  created_at: string
}
