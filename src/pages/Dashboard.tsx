import { useAuth } from "../hooks/useAuth";
import { DashboardLayout } from "../components/DashboardLayout";
import { TicketChart } from "../components/dashboard/TicketChart";
import { TicketsByCategory } from "../components/dashboard/TicketsByCategory";
import { ChatWidget } from "../components/chat";
import {
  Ticket,
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
} from "lucide-react";

export function Dashboard() {
  const { user } = useAuth();

  // Mock stats data
  const stats = [
    {
      title: "Total Tickets",
      value: "248",
      change: "+12%",
      trend: "up",
      icon: Ticket,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Active Chats",
      value: "18",
      change: "+3%",
      trend: "up",
      icon: MessageSquare,
      color: "bg-green-500",
      lightColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Active Users",
      value: "1,429",
      change: "+8%",
      trend: "up",
      icon: Users,
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Avg Response Time",
      value: "2.4h",
      change: "-15%",
      trend: "down",
      icon: Clock,
      color: "bg-orange-500",
      lightColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
  ];

  // Mock recent tickets
  const recentTickets = [
    {
      id: "#1234",
      subject: "Login issue with mobile app",
      status: "open",
      priority: "high",
      time: "5 min ago",
    },
    {
      id: "#1233",
      subject: "Payment not processing",
      status: "in_progress",
      priority: "urgent",
      time: "12 min ago",
    },
    {
      id: "#1232",
      subject: "Feature request: Dark mode",
      status: "open",
      priority: "low",
      time: "1 hour ago",
    },
    {
      id: "#1231",
      subject: "Unable to reset password",
      status: "resolved",
      priority: "medium",
      time: "2 hours ago",
    },
    {
      id: "#1230",
      subject: "API documentation unclear",
      status: "open",
      priority: "low",
      time: "3 hours ago",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <DashboardLayout pageTitle="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl shadow-indigo-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">
              Welcome back, {user?.email?.split("@")[0] || "User"}! 👋
            </h2>
            <p className="text-purple-100 text-lg">
              Here's what's happening with your customer support today
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`${stat.lightColor} p-3 rounded-xl shadow-md`}
                  >
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TicketChart />
          <TicketsByCategory />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Tickets */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Tickets
                </h3>
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  View all
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 hover:bg-gray-50 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {ticket.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {ticket.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{ticket.subject}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className={`text-xs font-medium ${getPriorityColor(
                            ticket.priority
                          )}`}
                        >
                          {ticket.priority.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {ticket.time}
                        </span>
                      </div>
                    </div>
                    {ticket.status === "resolved" ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : ticket.priority === "urgent" ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Activity className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Performance */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Performance
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      Resolution Rate
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      94%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full shadow-lg"
                      style={{ width: "94%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      Customer Satisfaction
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      4.8/5
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full shadow-lg"
                      style={{ width: "96%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      First Response
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      85%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full shadow-lg"
                      style={{ width: "85%" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 rounded-xl transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg">
                  <Ticket className="w-5 h-5" />
                  <span className="font-medium">Create New Ticket</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700 rounded-xl transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">Start Live Chat</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700 rounded-xl transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">View Reports</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Widget */}
      <ChatWidget companyName="SupportHub" position="bottom-right" />
    </DashboardLayout>
  );
}
