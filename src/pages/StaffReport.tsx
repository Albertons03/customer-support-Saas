import { useEffect, useMemo, useState } from 'react'
import { Bike, Download, TrendingUp, Users } from 'lucide-react'
import { DashboardLayout } from '../components/DashboardLayout'
import { listAttendanceRange, listStaff } from '../lib/hr'
import type { AttendanceWithStaff, StaffMember } from '../types/hr'

const today = () => new Date().toISOString().slice(0, 10)
const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

interface Row {
  staff: StaffMember
  total: number
  present: number
  late: number
  half_day: number
  leave: number
  absent: number
  rate: number
}

export function StaffReport() {
  const [from, setFrom] = useState(daysAgo(6))
  const [to, setTo] = useState(today())
  const [filter, setFilter] = useState<'all' | 'staff' | 'rider'>('all')
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [records, setRecords] = useState<AttendanceWithStaff[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([listStaff(), listAttendanceRange(from, to)])
      .then(([s, a]) => {
        setStaff(s)
        setRecords(a)
      })
      .finally(() => setLoading(false))
  }, [from, to])

  const rows: Row[] = useMemo(() => {
    return staff
      .filter((s) => (filter === 'all' ? true : s.staff_type === filter))
      .map((s) => {
        const recs = records.filter((r) => r.staff_id === s.id)
        const counts = recs.reduce(
          (acc, r) => ({ ...acc, [r.status]: (acc[r.status as keyof typeof acc] ?? 0) + 1 }),
          { present: 0, late: 0, half_day: 0, leave: 0, absent: 0 } as Record<string, number>,
        )
        const total = recs.length
        const attended = counts.present + counts.late + counts.half_day * 0.5
        const rate = total === 0 ? 0 : Math.round((attended / total) * 100)
        return {
          staff: s,
          total,
          present: counts.present,
          late: counts.late,
          half_day: counts.half_day,
          leave: counts.leave,
          absent: counts.absent,
          rate,
        }
      })
      .sort((a, b) => b.rate - a.rate)
  }, [staff, records, filter])

  const overall = useMemo(() => {
    const sum = rows.reduce(
      (acc, r) => ({
        present: acc.present + r.present,
        late: acc.late + r.late,
        half_day: acc.half_day + r.half_day,
        leave: acc.leave + r.leave,
        absent: acc.absent + r.absent,
        total: acc.total + r.total,
      }),
      { present: 0, late: 0, half_day: 0, leave: 0, absent: 0, total: 0 },
    )
    const attended = sum.present + sum.late + sum.half_day * 0.5
    const rate = sum.total === 0 ? 0 : Math.round((attended / sum.total) * 100)
    return { ...sum, rate }
  }, [rows])

  const exportCSV = () => {
    const header = ['Name', 'Code', 'Type', 'Department', 'Present', 'Late', 'HalfDay', 'Leave', 'Absent', 'Total', 'Rate%']
    const lines = rows.map((r) => [
      r.staff.full_name,
      r.staff.employee_code ?? '',
      r.staff.staff_type,
      r.staff.department ?? '',
      r.present,
      r.late,
      r.half_day,
      r.leave,
      r.absent,
      r.total,
      r.rate,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `staff-report-${from}_to_${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout pageTitle="Staff Report">
      <div className="space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/30 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/15 backdrop-blur p-3 rounded-xl"><TrendingUp className="w-7 h-7" /></div>
            <div>
              <h2 className="text-2xl font-bold">Staff Report</h2>
              <p className="text-purple-100 text-sm">Attendance summary across the selected date range.</p>
            </div>
          </div>
          <button onClick={exportCSV} className="bg-white text-indigo-700 hover:bg-purple-50 px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-lg">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-100 dark:border-gray-700 flex flex-wrap items-end gap-3">
          <Field label="From">
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
          </Field>
          <Field label="To">
            <input type="date" value={to} max={today()} onChange={(e) => setTo(e.target.value)} className="border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
          </Field>

          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden text-sm ml-auto">
            {(['all', 'staff', 'rider'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-3 py-2 capitalize ${
                  filter === k
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                }`}
              >
                {k === 'all' ? 'All' : k + 's'}
              </button>
            ))}
          </div>
        </div>

        {/* Overall stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <OverallCard label="Attendance Rate" value={`${overall.rate}%`} highlight />
          <OverallCard label="Present"  value={overall.present} />
          <OverallCard label="Late"     value={overall.late} />
          <OverallCard label="Half Day" value={overall.half_day} />
          <OverallCard label="Leave"    value={overall.leave} />
          <OverallCard label="Absent"   value={overall.absent} />
        </div>

        {/* Per-staff table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Staff</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Present</th>
                  <th className="px-4 py-3 text-right">Late</th>
                  <th className="px-4 py-3 text-right">Half</th>
                  <th className="px-4 py-3 text-right">Leave</th>
                  <th className="px-4 py-3 text-right">Absent</th>
                  <th className="px-4 py-3 text-right">Days</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr><td colSpan={9} className="p-6 text-center text-gray-500">Loading…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={9} className="p-6 text-center text-gray-500">No data for the selected range.</td></tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.staff.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold flex items-center justify-center text-xs">
                            {r.staff.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                              {r.staff.full_name}
                              {r.staff.staff_type === 'rider' && <Bike className="w-3.5 h-3.5 text-orange-500" />}
                            </p>
                            <p className="text-xs text-gray-500">{r.staff.employee_code} · {r.staff.department ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-400">{r.staff.staff_type}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">{r.present}</td>
                      <td className="px-4 py-3 text-right text-orange-600">{r.late}</td>
                      <td className="px-4 py-3 text-right text-amber-600">{r.half_day}</td>
                      <td className="px-4 py-3 text-right text-sky-600">{r.leave}</td>
                      <td className="px-4 py-3 text-right text-rose-600">{r.absent}</td>
                      <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{r.total}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-col items-end gap-1 min-w-[100px]">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{r.rate}%</span>
                          <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                r.rate >= 90 ? 'bg-emerald-500' : r.rate >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${r.rate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-xs text-gray-500 flex items-center gap-2">
          <Users className="w-3.5 h-3.5" /> Rate counts present + late as full attendance, half-day as 0.5.
        </div>
      </div>
    </DashboardLayout>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col text-xs text-gray-500 dark:text-gray-400">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  )
}

function OverallCard({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 shadow border ${highlight ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-transparent' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white'}`}>
      <p className={`text-xs uppercase tracking-wider ${highlight ? 'opacity-90' : 'text-gray-500 dark:text-gray-400'}`}>{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}
