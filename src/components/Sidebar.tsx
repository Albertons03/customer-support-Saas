import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  MessageSquare,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

interface MenuItem {
  name: string;
  icon: typeof LayoutDashboard;
  path: string;
  badge?: number;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const menuItems: MenuItem[] = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Tickets", icon: Ticket, path: "/tickets", badge: 12 },
    { name: "Chat", icon: MessageSquare, path: "/chat", badge: 3 },
    { name: "Knowledge Base", icon: BookOpen, path: "/knowledge-base" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-[50] h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-2xl
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-20" : "w-64"}
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          flex flex-col
        `}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-2 rounded-xl shadow-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                SupportHub
              </span>
            )}
          </div>

          {/* Collapse Button (Desktop only) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`
                      flex items-center px-3 py-2.5 rounded-xl transition-all duration-200
                      ${
                        active
                          ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-500/50 scale-105"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 hover:scale-105"
                      }
                      ${isCollapsed ? "justify-center" : ""}
                    `}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isCollapsed ? "" : "mr-3"
                      } flex-shrink-0`}
                    />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 font-medium">{item.name}</span>
                        {item.badge && (
                          <span
                            className={`
                              ml-auto px-2 py-0.5 text-xs font-semibold rounded-full
                              ${
                                active
                                  ? "bg-white text-indigo-600"
                                  : "bg-indigo-100 text-indigo-600"
                              }
                            `}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div
            className={`
              flex items-center
              ${isCollapsed ? "justify-center" : "justify-between"}
            `}
          >
            {!isCollapsed && (
              <div className="flex items-center flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            )}

            {isCollapsed ? (
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition flex-shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
