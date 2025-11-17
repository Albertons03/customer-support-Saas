import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

// Dummy data for last 7 days
const data = [
  { date: 'Mon', tickets: 24, resolved: 18 },
  { date: 'Tue', tickets: 32, resolved: 25 },
  { date: 'Wed', tickets: 28, resolved: 22 },
  { date: 'Thu', tickets: 45, resolved: 35 },
  { date: 'Fri', tickets: 38, resolved: 30 },
  { date: 'Sat', tickets: 20, resolved: 15 },
  { date: 'Sun', tickets: 18, resolved: 14 },
]

export function TicketChart() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Ticket Trends</h3>
        <p className="text-sm text-gray-600 mt-1">
          New and resolved tickets over the last 7 days
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            labelStyle={{
              color: '#111827',
              fontWeight: 600,
              marginBottom: '4px',
            }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
            }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="tickets"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ fill: '#6366f1', r: 5 }}
            activeDot={{ r: 7 }}
            name="New Tickets"
          />
          <Line
            type="monotone"
            dataKey="resolved"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', r: 5 }}
            activeDot={{ r: 7 }}
            name="Resolved"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
          <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
          <div>
            <p className="text-xs text-gray-600">Avg New/Day</p>
            <p className="text-lg font-semibold text-gray-900">29.3</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
          <div className="w-3 h-3 rounded-full bg-green-600"></div>
          <div>
            <p className="text-xs text-gray-600">Avg Resolved/Day</p>
            <p className="text-lg font-semibold text-gray-900">22.7</p>
          </div>
        </div>
      </div>
    </div>
  )
}
