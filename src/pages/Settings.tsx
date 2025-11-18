import { useState } from "react";
import { User, Building2, MessageSquare, Save, ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks";
import { useNavigate } from "react-router-dom";

type TabType = "profile" | "workspace" | "widget";

export function Settings() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const { user } = useAuth();
  const navigate = useNavigate();

  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.email?.split("@")[0] || "",
    email: user?.email || "",
    avatar: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Workspace state
  const [workspaceData, setWorkspaceData] = useState({
    companyName: "My Company",
    logo: "",
    timezone: "America/New_York",
  });

  // Widget state
  const [widgetData, setWidgetData] = useState({
    primaryColor: "#4f46e5",
    accentColor: "#9333ea",
    welcomeMessage: "Hi! How can we help you today?",
    position: "right" as "left" | "right",
  });

  const tabs = [
    { id: "profile" as TabType, name: "Profile", icon: User },
    { id: "workspace" as TabType, name: "Workspace", icon: Building2 },
    { id: "widget" as TabType, name: "Chat Widget", icon: MessageSquare },
  ];

  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  const handleSaveProfile = async () => {
    // TODO: Implement profile update
    console.log("Saving profile:", profileData);
  };

  const handleSaveWorkspace = async () => {
    // TODO: Implement workspace update
    console.log("Saving workspace:", workspaceData);
  };

  const handleSaveWidget = async () => {
    // TODO: Implement widget config update
    console.log("Saving widget:", widgetData);
  };

  const generateEmbedCode = () => {
    return `<script>
  (function() {
    var s = document.createElement('script');
    s.src = '${window.location.origin}/widget.js';
    s.dataset.workspaceId = 'YOUR_WORKSPACE_ID';
    s.dataset.position = '${widgetData.position}';
    s.dataset.primaryColor = '${widgetData.primaryColor}';
    s.dataset.accentColor = '${widgetData.accentColor}';
    document.body.appendChild(s);
  })();
</script>`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-14">
            Manage your account, workspace, and chat widget settings
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-2 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                        : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Profile Information
                  </h2>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    {/* Avatar */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Avatar URL
                      </label>
                      <input
                        type="url"
                        value={profileData.avatar}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            avatar: e.target.value,
                          })
                        }
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Change Password */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Change Password
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={profileData.currentPassword}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={profileData.newPassword}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={profileData.confirmPassword}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Workspace Tab */}
            {activeTab === "workspace" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Workspace Settings
                  </h2>

                  <div className="space-y-4">
                    {/* Company Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={workspaceData.companyName}
                        onChange={(e) =>
                          setWorkspaceData({
                            ...workspaceData,
                            companyName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    {/* Logo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Company Logo URL
                      </label>
                      <input
                        type="url"
                        value={workspaceData.logo}
                        onChange={(e) =>
                          setWorkspaceData({
                            ...workspaceData,
                            logo: e.target.value,
                          })
                        }
                        placeholder="https://example.com/logo.png"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    {/* Timezone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Timezone
                      </label>
                      <select
                        value={workspaceData.timezone}
                        onChange={(e) =>
                          setWorkspaceData({
                            ...workspaceData,
                            timezone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        {timezones.map((tz) => (
                          <option key={tz} value={tz}>
                            {tz}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSaveWorkspace}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Chat Widget Tab */}
            {activeTab === "widget" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Chat Widget Customization
                  </h2>

                  <div className="space-y-4">
                    {/* Primary Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={widgetData.primaryColor}
                          onChange={(e) =>
                            setWidgetData({
                              ...widgetData,
                              primaryColor: e.target.value,
                            })
                          }
                          className="h-10 w-20 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={widgetData.primaryColor}
                          onChange={(e) =>
                            setWidgetData({
                              ...widgetData,
                              primaryColor: e.target.value,
                            })
                          }
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Accent Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={widgetData.accentColor}
                          onChange={(e) =>
                            setWidgetData({
                              ...widgetData,
                              accentColor: e.target.value,
                            })
                          }
                          className="h-10 w-20 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={widgetData.accentColor}
                          onChange={(e) =>
                            setWidgetData({
                              ...widgetData,
                              accentColor: e.target.value,
                            })
                          }
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Welcome Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Welcome Message
                      </label>
                      <textarea
                        value={widgetData.welcomeMessage}
                        onChange={(e) =>
                          setWidgetData({
                            ...widgetData,
                            welcomeMessage: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    {/* Widget Position */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Widget Position
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="position"
                            value="left"
                            checked={widgetData.position === "left"}
                            onChange={(e) =>
                              setWidgetData({
                                ...widgetData,
                                position: e.target.value as "left" | "right",
                              })
                            }
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300">
                            Bottom Left
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="position"
                            value="right"
                            checked={widgetData.position === "right"}
                            onChange={(e) =>
                              setWidgetData({
                                ...widgetData,
                                position: e.target.value as "left" | "right",
                              })
                            }
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300">
                            Bottom Right
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Embed Code */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Embed Code
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Copy and paste this code before the closing{" "}
                    <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
                      &lt;/body&gt;
                    </code>{" "}
                    tag on your website.
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      {generateEmbedCode()}
                    </pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generateEmbedCode());
                        alert("Embed code copied to clipboard!");
                      }}
                      className="absolute top-3 right-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded font-medium transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSaveWidget}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
