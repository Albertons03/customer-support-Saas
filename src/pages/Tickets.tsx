import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { TicketFilters } from "../components/tickets/TicketFilters";
import { TicketList } from "../components/tickets/TicketList";
import { Pagination } from "../components/tickets/Pagination";
import { supabase } from "../lib/supabase";
import type { Ticket } from "../types";
import { Plus } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export function Tickets() {
  const navigate = useNavigate();

  // State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Fetch tickets from Supabase
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);

      // For demo purposes, we'll create some sample data if none exists
      // In production, you'd just query real data
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tickets:", error);
        // Use mock data for demo if table doesn't exist yet
        setTickets(getMockTickets());
      } else if (data && data.length > 0) {
        setTickets(data as Ticket[]);
      } else {
        // No tickets yet, use mock data
        setTickets(getMockTickets());
      }
    } catch (err) {
      console.error("Error:", err);
      setTickets(getMockTickets());
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demo (remove when database is set up)
  const getMockTickets = (): Ticket[] => {
    return [
      {
        id: "1",
        workspace_id: "1",
        customer_name: "John Doe",
        customer_email: "john@example.com",
        customer_id: null,
        subject: "Login issue with mobile app",
        description: "Cannot login to my account on iOS",
        status: "open",
        priority: "high",
        category: "technical",
        assigned_to: null,
        tags: [],
        internal_notes: null,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        resolved_at: null,
        closed_at: null,
      },
      {
        id: "2",
        workspace_id: "1",
        customer_name: "Jane Smith",
        customer_email: "jane@example.com",
        customer_id: null,
        subject: "Payment not processing",
        description: "Getting error when trying to upgrade plan",
        status: "in_progress",
        priority: "urgent",
        category: "billing",
        assigned_to: null,
        tags: [],
        internal_notes: null,
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        resolved_at: null,
        closed_at: null,
      },
      {
        id: "3",
        workspace_id: "1",
        customer_name: "Bob Johnson",
        customer_email: "bob@example.com",
        customer_id: null,
        subject: "Feature request: Dark mode",
        description: "Would love to have a dark mode option",
        status: "open",
        priority: "low",
        category: "feature_request",
        assigned_to: null,
        tags: [],
        internal_notes: null,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        resolved_at: null,
        closed_at: null,
      },
      {
        id: "4",
        workspace_id: "1",
        customer_name: "Alice Brown",
        customer_email: "alice@example.com",
        customer_id: null,
        subject: "Unable to reset password",
        description: "Not receiving password reset email",
        status: "resolved",
        priority: "medium",
        category: "technical",
        assigned_to: null,
        tags: [],
        internal_notes: null,
        created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
        closed_at: null,
      },
      {
        id: "5",
        workspace_id: "1",
        customer_name: "Charlie Davis",
        customer_email: "charlie@example.com",
        customer_id: null,
        subject: "Bug: Dashboard not loading",
        description: "Getting blank screen on dashboard",
        status: "waiting_customer",
        priority: "high",
        category: "bug",
        assigned_to: null,
        tags: [],
        internal_notes: null,
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        resolved_at: null,
        closed_at: null,
      },
    ];
  };

  // Apply filters
  useEffect(() => {
    let result = [...tickets];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (ticket) =>
          ticket.id.toLowerCase().includes(query) ||
          ticket.subject.toLowerCase().includes(query) ||
          ticket.customer_name.toLowerCase().includes(query) ||
          ticket.customer_email.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter) {
      result = result.filter((ticket) => ticket.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter) {
      result = result.filter((ticket) => ticket.priority === priorityFilter);
    }

    // Category filter
    if (categoryFilter) {
      result = result.filter((ticket) => ticket.category === categoryFilter);
    }

    setFilteredTickets(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [tickets, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setPriorityFilter("");
    setCategoryFilter("");
  };

  const hasActiveFilters = !!(
    searchQuery ||
    statusFilter ||
    priorityFilter ||
    categoryFilter
  );

  const handleTicketClick = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`);
  };

  return (
    <DashboardLayout pageTitle="Tickets">
      <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Tickets</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage and track all customer support tickets
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-sm">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Ticket</span>
          </button>
        </div>

        {/* Filters */}
        <TicketFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Ticket List */}
        <TicketList
          tickets={paginatedTickets}
          loading={loading}
          onTicketClick={handleTicketClick}
        />

        {/* Pagination */}
        {!loading && filteredTickets.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredTickets.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
