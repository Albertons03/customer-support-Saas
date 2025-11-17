import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import type { Ticket, Message, User } from "../types";
import {
  ArrowLeft,
  Edit2,
  User as UserIcon,
  Mail,
  Calendar,
  Tag,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  Send,
  Paperclip,
  Lock,
  MessageSquare,
  ChevronDown,
} from "lucide-react";

const STATUS_CONFIG = {
  open: {
    label: "Open",
    color: "bg-blue-100 text-blue-800",
    icon: AlertCircle,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  waiting_customer: {
    label: "Waiting Customer",
    color: "bg-purple-100 text-purple-800",
    icon: Clock,
  },
  resolved: {
    label: "Resolved",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle2,
  },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-800", icon: X },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-gray-100 text-gray-800" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-800" },
  high: { label: "High", color: "bg-orange-100 text-orange-800" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800" },
};

const CATEGORY_CONFIG = {
  technical: { label: "Technical", icon: "🔧" },
  billing: { label: "Billing", icon: "💳" },
  feature_request: { label: "Feature Request", icon: "✨" },
  bug: { label: "Bug", icon: "🐛" },
  general: { label: "General", icon: "💬" },
};

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageContent, setMessageContent] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendingNote, setSendingNote] = useState(false);
  const [showInternalNotes, setShowInternalNotes] = useState(true);

  // Edit mode states
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingPriority, setEditingPriority] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [newTag, setNewTag] = useState("");

  // Load ticket and messages
  useEffect(() => {
    if (id) {
      loadTicketData();
      loadAgents();
      subscribeToMessages();
      subscribeToTicketChanges();
    }

    return () => {
      // Cleanup subscriptions
      supabase.channel(`ticket-${id}`).unsubscribe();
      supabase.channel(`messages-${id}`).unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadTicketData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // For demo, use mock data if database is not set up
      const mockTicket: Ticket = {
        id: id,
        workspace_id: "1",
        customer_name: "John Doe",
        customer_email: "john@example.com",
        customer_id: null,
        subject: "Login issue with mobile app",
        description:
          "I cannot login to my account on iOS. When I enter my credentials and tap Sign In, nothing happens. I have tried resetting my password but still having the same issue.",
        status: "in_progress",
        priority: "high",
        category: "technical",
        assigned_to: user?.id || null,
        tags: ["ios", "authentication", "mobile"],
        internal_notes: "User contacted via email. Waiting for logs.",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        resolved_at: null,
        closed_at: null,
      };

      setTicket(mockTicket);

      // Load mock messages
      const mockMessages: Message[] = [
        {
          id: "1",
          ticket_id: id,
          sender_id: null,
          sender_name: "John Doe",
          sender_email: "john@example.com",
          content:
            "I cannot login to my account on iOS. When I enter my credentials and tap Sign In, nothing happens.",
          is_internal: false,
          attachments: [],
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          ticket_id: id,
          sender_id: user?.id || "1",
          sender_name: "Support Agent",
          sender_email: "support@example.com",
          content:
            "Hi John, thanks for reaching out. I'm sorry to hear you're experiencing login issues. Could you please provide the following information:\n\n1. iOS version you're using\n2. App version\n3. Any error messages you see",
          is_internal: false,
          attachments: [],
          created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        },
        {
          id: "3",
          ticket_id: id,
          sender_id: user?.id || "1",
          sender_name: "Support Agent",
          sender_email: "support@example.com",
          content:
            "Checking authentication logs. Seems like an API timeout issue.",
          is_internal: true,
          attachments: [],
          created_at: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
        },
        {
          id: "4",
          ticket_id: id,
          sender_id: null,
          sender_name: "John Doe",
          sender_email: "john@example.com",
          content:
            "I'm using iOS 17.1 and app version 2.3.4. There are no error messages, the button just doesn't respond.",
          is_internal: false,
          attachments: [],
          created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        },
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error("Error loading ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      // Mock agents for demo
      const mockAgents: User[] = [
        {
          id: "1",
          email: "agent1@example.com",
          full_name: "Alice Johnson",
          role: "agent",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          email: "agent2@example.com",
          full_name: "Bob Smith",
          role: "agent",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      setAgents(mockAgents);
    } catch (error) {
      console.error("Error loading agents:", error);
    }
  };

  // Real-time subscriptions
  const subscribeToMessages = () => {
    if (!id) return;

    const channel = supabase
      .channel(`messages-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `ticket_id=eq.${id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const subscribeToTicketChanges = () => {
    if (!id) return;

    const channel = supabase
      .channel(`ticket-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const updatedTicket = payload.new as Ticket;
          setTicket(updatedTicket);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  // Update ticket fields
  const updateTicket = async (updates: Partial<Ticket>) => {
    if (!ticket) return;

    try {
      // In production, update via Supabase
      // await supabase.from('tickets').update(updates).eq('id', ticket.id)

      // For demo, update local state
      setTicket({
        ...ticket,
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating ticket:", error);
      alert("Failed to update ticket");
    }
  };

  const handleStatusChange = async (newStatus: Ticket["status"]) => {
    await updateTicket({ status: newStatus });
    setEditingStatus(false);
  };

  const handlePriorityChange = async (newPriority: Ticket["priority"]) => {
    await updateTicket({ priority: newPriority });
    setEditingPriority(false);
  };

  const handleCategoryChange = async (newCategory: Ticket["category"]) => {
    await updateTicket({ category: newCategory });
    setEditingCategory(false);
  };

  const handleAssigneeChange = async (agentId: string | null) => {
    await updateTicket({ assigned_to: agentId });
    setEditingAssignee(false);
  };

  const handleAddTag = async () => {
    if (!ticket || !newTag.trim()) return;

    const updatedTags = [...ticket.tags, newTag.trim()];
    await updateTicket({ tags: updatedTags });
    setNewTag("");
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!ticket) return;

    const updatedTags = ticket.tags.filter((tag) => tag !== tagToRemove);
    await updateTicket({ tags: updatedTags });
  };

  const handleCloseTicket = async () => {
    if (!confirm("Are you sure you want to close this ticket?")) return;
    await updateTicket({
      status: "closed",
      closed_at: new Date().toISOString(),
    });
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !ticket || !user) return;

    try {
      setSendingMessage(true);

      const newMessage: Message = {
        id: Date.now().toString(),
        ticket_id: ticket.id,
        sender_id: user.id,
        sender_name:
          (user.user_metadata?.full_name as string) || user.email || "Agent",
        sender_email: user.email || "agent@example.com",
        content: messageContent.trim(),
        is_internal: false,
        attachments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // In production, insert via Supabase
      // await supabase.from('messages').insert(newMessage)

      // For demo, add to local state
      setMessages([...messages, newMessage]);
      setMessageContent("");

      // Update ticket status if it was waiting for customer
      if (ticket.status === "waiting_customer") {
        await updateTicket({ status: "in_progress" });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  // Send internal note
  const handleSendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNote.trim() || !ticket || !user) return;

    try {
      setSendingNote(true);

      const newNote: Message = {
        id: Date.now().toString(),
        ticket_id: ticket.id,
        sender_id: user.id,
        sender_name:
          (user.user_metadata?.full_name as string) || user.email || "Agent",
        sender_email: user.email || "agent@example.com",
        content: internalNote.trim(),
        is_internal: true,
        attachments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // In production, insert via Supabase
      // await supabase.from('messages').insert(newNote)

      // For demo, add to local state
      setMessages([...messages, newNote]);
      setInternalNote("");
    } catch (error) {
      console.error("Error sending note:", error);
      alert("Failed to send internal note");
    } finally {
      setSendingNote(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Loading...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout pageTitle="Ticket Not Found">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ticket not found
          </h2>
          <p className="text-gray-600 mb-6">
            The ticket you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/tickets")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Tickets
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const StatusIcon = STATUS_CONFIG[ticket.status].icon;
  const customerMessages = messages.filter((m) => !m.is_internal);
  const internalNotes = messages.filter((m) => m.is_internal);

  return (
    <DashboardLayout pageTitle={`Ticket #${ticket.id.slice(0, 8)}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/tickets")}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {ticket.subject}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Created {formatDate(ticket.created_at)} • Updated{" "}
              {formatDate(ticket.updated_at)}
            </p>
          </div>
          <button
            onClick={handleCloseTicket}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Close Ticket
          </button>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Ticket Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Status</h3>
                <button
                  onClick={() => setEditingStatus(!editingStatus)}
                  className="p-1 hover:bg-gray-100 rounded transition"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {editingStatus ? (
                <div className="space-y-2">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() =>
                        handleStatusChange(key as Ticket["status"])
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        ticket.status === key
                          ? "bg-indigo-50 border-indigo-200"
                          : "hover:bg-gray-50"
                      } border`}
                    >
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
                      >
                        {config.label}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    STATUS_CONFIG[ticket.status].color
                  }`}
                >
                  <StatusIcon className="w-4 h-4" />
                  {STATUS_CONFIG[ticket.status].label}
                </span>
              )}
            </div>

            {/* Priority */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Priority</h3>
                <button
                  onClick={() => setEditingPriority(!editingPriority)}
                  className="p-1 hover:bg-gray-100 rounded transition"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {editingPriority ? (
                <div className="space-y-2">
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() =>
                        handlePriorityChange(key as Ticket["priority"])
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        ticket.priority === key
                          ? "bg-indigo-50 border-indigo-200"
                          : "hover:bg-gray-50"
                      } border`}
                    >
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
                      >
                        {config.label}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                    PRIORITY_CONFIG[ticket.priority].color
                  }`}
                >
                  {PRIORITY_CONFIG[ticket.priority].label}
                </span>
              )}
            </div>

            {/* Category */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Category</h3>
                <button
                  onClick={() => setEditingCategory(!editingCategory)}
                  className="p-1 hover:bg-gray-100 rounded transition"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {editingCategory ? (
                <div className="space-y-2">
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() =>
                        handleCategoryChange(key as Ticket["category"])
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        ticket.category === key
                          ? "bg-indigo-50 border-indigo-200"
                          : "hover:bg-gray-50"
                      } border`}
                    >
                      <span className="text-sm">
                        {config.icon} {config.label}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-sm">
                  {CATEGORY_CONFIG[ticket.category].icon}{" "}
                  {CATEGORY_CONFIG[ticket.category].label}
                </span>
              )}
            </div>

            {/* Assigned Agent */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Assigned Agent</h3>
                <button
                  onClick={() => setEditingAssignee(!editingAssignee)}
                  className="p-1 hover:bg-gray-100 rounded transition"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {editingAssignee ? (
                <div className="space-y-2">
                  <button
                    onClick={() => handleAssigneeChange(null)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 border text-sm"
                  >
                    Unassigned
                  </button>
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleAssigneeChange(agent.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        ticket.assigned_to === agent.id
                          ? "bg-indigo-50 border-indigo-200"
                          : "hover:bg-gray-50"
                      } border`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs text-indigo-600">
                          {agent.full_name?.charAt(0) ||
                            agent.email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm">
                          {agent.full_name || agent.email}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : ticket.assigned_to ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm text-indigo-600">
                    {agents
                      .find((a) => a.id === ticket.assigned_to)
                      ?.full_name?.charAt(0) || "A"}
                  </div>
                  <span className="text-sm">
                    {agents.find((a) => a.id === ticket.assigned_to)
                      ?.full_name || "Agent"}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-500">Unassigned</span>
              )}
            </div>

            {/* Customer Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Customer Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{ticket.customer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a
                    href={`mailto:${ticket.customer_email}`}
                    className="text-indigo-600 hover:underline"
                  >
                    {ticket.customer_email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Customer since {formatDate(ticket.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Tags</h3>
                <button
                  onClick={() => setEditingTags(!editingTags)}
                  className="p-1 hover:bg-gray-100 rounded transition"
                >
                  <Tag className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {ticket.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                  >
                    {tag}
                    {editingTags && (
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-600 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {editingTags && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Messages & Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Description */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            {/* Message Thread */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Message Thread ({customerMessages.length})
                </h3>
              </div>

              <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
                {customerMessages.map((message) => (
                  <div key={message.id} className="flex gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-gray-600">
                        {message.sender_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {message.sender_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-6 border-t border-gray-200"
              >
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Type your reply..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                  rows={4}
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span className="text-sm">Attach</span>
                  </button>
                  <button
                    type="submit"
                    disabled={!messageContent.trim() || sendingMessage}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sendingMessage ? "Sending..." : "Send Reply"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Internal Notes */}
            <div className="bg-amber-50 rounded-lg border border-amber-200">
              <button
                onClick={() => setShowInternalNotes(!showInternalNotes)}
                className="w-full p-6 flex items-center justify-between hover:bg-amber-100 transition"
              >
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-600" />
                  Internal Notes ({internalNotes.length})
                  <span className="text-xs text-amber-600 font-normal">
                    (Private - Not visible to customer)
                  </span>
                </h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 transition-transform ${
                    showInternalNotes ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showInternalNotes && (
                <>
                  <div className="px-6 pb-6 space-y-4 max-h-[400px] overflow-y-auto">
                    {internalNotes.length === 0 ? (
                      <p className="text-amber-700 text-sm italic">
                        No internal notes yet
                      </p>
                    ) : (
                      internalNotes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-white rounded-lg border border-amber-200 p-4"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900 text-sm">
                              {note.sender_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(note.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">
                            {note.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Note Input */}
                  <form
                    onSubmit={handleSendNote}
                    className="p-6 border-t border-amber-200"
                  >
                    <textarea
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      placeholder="Add an internal note (only visible to agents)..."
                      className="w-full px-4 py-3 border border-amber-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 mb-3 bg-white"
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!internalNote.trim() || sendingNote}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4" />
                        <span>
                          {sendingNote ? "Adding..." : "Add Internal Note"}
                        </span>
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
