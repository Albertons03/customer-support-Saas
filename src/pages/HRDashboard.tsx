import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Plane,
  Bike,
  CalendarDays,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { DashboardLayout } from '../components/DashboardLayout'
import { listAttendance, listLeaveRequests, listStaff } from '../lib/hr'
import type {
  AttendanceWithStaff,
  LeaveRequestWithStaff,
  StaffMember,
} from '../types/hr'

const today = () => new Date().toISOString().slice(0, 10)

const STATUS_BADGE: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  absent: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  half_day: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  leave: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  late: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

export function HRDashboard() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [attendance, setAttendance] = useState<AttendanceWithStaff[]>([])
  const [leaves, setLeaves] = useState<LeaveRequestWithStaff[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listStaff(), listAttendance(today()), listLeaveRequests()])
      .then(([s, a, l]) => {
        setStaff(s)
        setAttendance(a)
        setLeaves(l)
      })
      .finally(() => setLoading(false))
  }, [])

  const totals = useMemo(() => {
    const total = staff.length
    const riders = staff.filter((s) => s.staff_type === 'rider').length
    const counts = attendance.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1
      return acc
    }, {})
    return {
      total,
      riders,
      staff: total - riders,
      present: counts.present ?? 0,
      late: counts.late ?? 0,
      absent: counts.absent ?? 0,
      half_day: counts.half_day ?? 0,
      onLeave: counts.leave ?? 0,
      pendingLeaves: leaves.filter((l) => l.status === 'pending').length,
    }
  }, [staff, attendance, leaves])

  const stats = [
    {
      title: 'Total Headcount',
      value: totals.total,
      icon: Users,
      gradient: 'from-indigo-500 to-purple-600',
      sub: `${totals.staff} staff · ${totals.riders} riders`,
    },
    {
      title: 'Present Today',
      value: totals.present + totals.late + totals.half_day,
      icon: UserCheck,
      gradient: 'from-emerald-500 to-teal-600',
      sub: `${totals.late} late · ${totals.half_day} half day`,
    },
    {
      title: 'Absent / Off',
      value: totals.absent + totals.onLeave,
      icon: UserX,
      gradient: 'from-rose-500 to-red-600',
      sub: `${totals.absent} absent · ${totals.onLeave} on leave`,
    },
    {
      title: 'Pending Leave Requests',
      value: totals.pendingLeaves,
      icon: Plane,
      gradient: 'from-amber-500 to-orange-600',
      sub: 'Awaiting your review',
    },
  ]

  const recentLeaves = leaves.slice(0, 6)
  const todays = attendance.slice(0, 8)

  return (
    <DashboardLayout pageTitle="HR Dashboard">
      <div className="space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl shadow-indigo-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-purple-100 uppercase tracking-wider text-xs font-semibold">
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <h2 className="text-3xl font-bold mt-1">HR Management Center</h2>
              <p className="text-purple-100 text-lg mt-1">
                Track attendance, review leave requests, and manage your staff & riders.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/hr/attendance"
                className="bg-white/15 hover:bg-white/25 backdrop-blur px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2"
              >
                <CalendarDays className="w-5 h-5" /> Mark Attendance
              </Link>
              <Link
                to="/hr/leaves"
                className="bg-white text-indigo-700 hover:bg-purple-50 px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-lg"
              >
                <Plane className="w-5 h-5" /> Review Leaves
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.title}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 border border-gray-100 dark:border-gray-700"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">{s.title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {loading ? '—' : s.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.sub}</p>
              </div>
            )
          })}
        </div>

        {/* Today's attendance + leave queue */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's attendance */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-gray-800 dark:to-gray-700/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Attendance</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Snapshot for {today()}</p>
              </div>
              <Link to="/hr/attendance" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Open attendance →
              </Link>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <div className="p-6 text-sm text-gray-500">Loading…</div>
              ) : todays.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">No attendance recorded yet today.</div>
              ) : (
                todays.map((a) => (
                  <div key={a.id} className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {a.staff.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{a.staff.full_name}</p>
                        {a.staff.staff_type === 'rider' && (
                          <Bike className="w-4 h-4 text-orange-500" aria-label="Rider" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {a.staff.employee_code} · {a.staff.department ?? '—'}
                      </p>
                    </div>
                    <div className="text-right hidden sm:block text-xs text-gray-500 dark:text-gray-400 min-w-[110px]">
                      {a.check_in ? `In ${a.check_in.slice(0, 5)}` : '—'}
                      {a.check_out ? ` · Out ${a.check_out.slice(0, 5)}` : ''}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[a.status]}`}>
                      {a.status.replace('_', ' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Leave queue */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-700/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Leave Requests</h3>
              <Link to="/hr/leaves" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                All →
              </Link>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <div className="p-6 text-sm text-gray-500">Loading…</div>
              ) : recentLeaves.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">No leave requests yet.</div>
              ) : (
                recentLeaves.map((l) => (
                  <div key={l.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{l.staff.full_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {l.leave_type} · {l.days_count} day{Number(l.days_count) === 1 ? '' : 's'}
                          {l.is_half_day ? ' (half)' : ''}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {l.start_date}
                          {l.end_date !== l.start_date ? ` → ${l.end_date}` : ''}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[l.status]}`}>
                        {l.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {l.status}</span>
                        ) : l.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1"><XCircle className="w-3 h-3" /> {l.status}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {l.status}</span>
                        )}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick role breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <RoleBreakdown title="Staff" icon={Users} count={totals.staff} present={attendance.filter((a) => a.staff.staff_type === 'staff' && (a.status === 'present' || a.status === 'late')).length} gradient="from-indigo-500 to-purple-600" />
          <RoleBreakdown title="Riders" icon={Bike} count={totals.riders} present={attendance.filter((a) => a.staff.staff_type === 'rider' && (a.status === 'present' || a.status === 'late')).length} gradient="from-orange-500 to-rose-600" />
        </div>
      </div>
    </DashboardLayout>
  )
}

function RoleBreakdown({
  title,
  icon: Icon,
  count,
  present,
  gradient,
}: {
  title: string
  icon: typeof Users
  count: number
  present: number
  gradient: string
}) {
  const pct = count === 0 ? 0 : Math.round((present / count) * 100)
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{count}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
          <p className="text-lg font-semibold text-emerald-600">{pct}%</p>
        </div>
      </div>
      <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className={`bg-gradient-to-r ${gradient} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center gap-1 mt-3 text-xs text-gray-500">
        <Clock className="w-3.5 h-3.5" /> {present} present right now
      </div>
    </div>
  )
}
