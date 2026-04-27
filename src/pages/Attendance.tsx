import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  Sun,
  Plane,
  Clock,
  Bike,
  Search,
  CalendarDays,
} from 'lucide-react'
import { DashboardLayout } from '../components/DashboardLayout'
import { listAttendance, listStaff, recordAttendance } from '../lib/hr'
import type { AttendanceStatus, AttendanceWithStaff, StaffMember } from '../types/hr'

const STATUS_OPTIONS: { key: AttendanceStatus; label: string; icon: typeof CheckCircle2; color: string; activeColor: string }[] = [
  { key: 'present', label: 'Present',  icon: CheckCircle2, color: 'text-emerald-600 hover:bg-emerald-50',  activeColor: 'bg-emerald-600 text-white' },
  { key: 'late',    label: 'Late',     icon: Clock,        color: 'text-orange-600 hover:bg-orange-50',    activeColor: 'bg-orange-600 text-white' },
  { key: 'half_day',label: 'Half Day', icon: Sun,          color: 'text-amber-600 hover:bg-amber-50',      activeColor: 'bg-amber-600 text-white' },
  { key: 'leave',   label: 'Leave',    icon: Plane,        color: 'text-sky-600 hover:bg-sky-50',          activeColor: 'bg-sky-600 text-white' },
  { key: 'absent',  label: 'Absent',   icon: XCircle,      color: 'text-rose-600 hover:bg-rose-50',        activeColor: 'bg-rose-600 text-white' },
]

const today = () => new Date().toISOString().slice(0, 10)

export function Attendance() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [records, setRecords] = useState<AttendanceWithStaff[]>([])
  const [date, setDate] = useState<string>(today())
  const [filter, setFilter] = useState<'all' | 'staff' | 'rider'>('all')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async (d: string) => {
    setLoading(true)
    try {
      const [s, a] = await Promise.all([listStaff(), listAttendance(d)])
      setStaff(s)
      setRecords(a)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh(date)
  }, [date])

  const statusByStaff = useMemo(() => {
    const map = new Map<string, AttendanceStatus>()
    records.forEach((r) => map.set(r.staff_id, r.status))
    return map
  }, [records])

  const visible = useMemo(() => {
    return staff
      .filter((s) => (filter === 'all' ? true : s.staff_type === filter))
      .filter((s) => {
        if (!query.trim()) return true
        const q = query.toLowerCase()
        return (
          s.full_name.toLowerCase().includes(q) ||
          (s.employee_code ?? '').toLowerCase().includes(q) ||
          (s.department ?? '').toLowerCase().includes(q)
        )
      })
  }, [staff, filter, query])

  const summary = useMemo(() => {
    const total = staff.length
    const counts = records.reduce<Record<AttendanceStatus, number>>(
      (acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }),
      { present: 0, late: 0, half_day: 0, leave: 0, absent: 0 },
    )
    const marked = records.length
    return { total, marked, unmarked: total - marked, ...counts }
  }, [staff.length, records])

  const onMark = async (staffId: string, status: AttendanceStatus) => {
    setBusy(staffId)
    try {
      await recordAttendance(staffId, status, date)
      await refresh(date)
    } finally {
      setBusy(null)
    }
  }

  return (
    <DashboardLayout pageTitle="Attendance">
      <div className="space-y-6">
        {/* Top controls */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex flex-wrap items-end gap-4 justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Daily Attendance</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mark each staff member or rider as Present / Late / Half Day / Leave / Absent.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col text-xs text-gray-500 dark:text-gray-400">
                Date
                <div className="relative mt-1">
                  <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={date}
                    max={today()}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
              </label>

              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden text-sm">
                {(['all', 'staff', 'rider'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className={`px-3 py-2 capitalize ${
                      filter === k
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {k === 'all' ? 'All' : k + 's'}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name / code"
                  className="pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm w-56"
                />
              </div>
            </div>
          </div>

          {/* Summary chips */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-6">
            <Chip label="Total"    value={summary.total}    color="from-gray-500 to-gray-700" />
            <Chip label="Present"  value={summary.present}  color="from-emerald-500 to-teal-600" />
            <Chip label="Late"     value={summary.late}     color="from-orange-500 to-red-500" />
            <Chip label="Half Day" value={summary.half_day} color="from-amber-500 to-orange-500" />
            <Chip label="Leave"    value={summary.leave}    color="from-sky-500 to-indigo-600" />
            <Chip label="Absent"   value={summary.absent}   color="from-rose-500 to-pink-600" />
          </div>
        </div>

        {/* Roster */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">Loading roster…</div>
          ) : visible.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No staff match the filter.</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {visible.map((s) => {
                const current = statusByStaff.get(s.id)
                return (
                  <li key={s.id} className="p-4 sm:px-6 flex items-center gap-4 flex-wrap">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold flex items-center justify-center shadow">
                      {s.full_name.charAt(0)}
                    </div>
                    <div className="min-w-[180px] flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white">{s.full_name}</p>
                        {s.staff_type === 'rider' && <Bike className="w-4 h-4 text-orange-500" />}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {s.employee_code} · {s.position ?? '—'} · {s.department ?? '—'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map(({ key, label, icon: Icon, color, activeColor }) => {
                        const isActive = current === key
                        return (
                          <button
                            key={key}
                            disabled={busy === s.id}
                            onClick={() => onMark(s.id, key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border border-transparent transition-all flex items-center gap-1.5 ${
                              isActive ? `${activeColor} shadow-md` : `bg-gray-50 dark:bg-gray-900 ${color}`
                            } disabled:opacity-50`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

function Chip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-3 text-white bg-gradient-to-br ${color} shadow`}>
      <p className="text-xs uppercase tracking-wider opacity-90">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
