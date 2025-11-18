import { DashboardLayout } from "../components/DashboardLayout";
import { ChatWidget } from "../components/chat/ChatWidget";

export function Chat() {
  return (
    <DashboardLayout pageTitle="Live Chat">
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Customer Chat
          </h2>
          <p className="text-gray-600 mb-6">
            Test the chat widget here. In production, this would show all active
            customer conversations.
          </p>

          {/* Chat Widget for testing */}
          <div className="max-w-4xl">
            <ChatWidget />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
