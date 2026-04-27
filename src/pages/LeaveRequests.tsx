import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  X,
  Clock,
  Plus,
  Plane,
  Bike,
  CalendarRange,
  Filter,
} from 'lucide-react'
import { DashboardLayout } from '../components/DashboardLayout'
import {
  createLeaveRequest,
  listLeaveRequests,
  listStaff,
  reviewLeaveRequest,
} from '../lib/hr'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import type {
  LeaveRequestWithStaff,
  LeaveStatus,
  LeaveType,
  StaffMember,
} from '../types/hr'

const STATUS_BADGE: Record<LeaveStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

const LEAVE_TYPES: LeaveType[] = ['sick', 'casual', 'annual', 'unpaid', 'other']

const today = () => new Date().toISOString().slice(0, 10)

export function LeaveRequests() {
  const { user } = useAuth()
  const { isHR } = useProfile()
  const [items, setItems] = useState<LeaveRequestWithStaff[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [filter, setFilter] = useState<LeaveStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      const [l, s] = await Promise.all([listLeaveRequests(), listStaff()])
      setItems(l)
      setStaff(s)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.status === filter)),
    [items, filter],
  )

  const counts = useMemo(() => {
    const c: Record<LeaveStatus | 'all', number> = {
      all: items.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    }
    items.forEach((i) => (c[i.status] = (c[i.status] ?? 0) + 1))
    return c
  }, [items])

  const onReview = async (id: string, status: LeaveStatus) => {
    if (!user) return
    setBusy(id)
    try {
      await reviewLeaveRequest(id, status, user.id)
      await refresh()
    } finally {
      setBusy(null)
    }
  }

  return (
    <DashboardLayout pageTitle="Leave Requests">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/30 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/15 backdrop-blur p-3 rounded-xl"><Plane className="w-7 h-7" /></div>
            <div>
              <h2 className="text-2xl font-bold">Leave Requests</h2>
              <p className="text-purple-100 text-sm">Approve, reject, or file leave on behalf of your team.</p>
            </div>
          </div>
          {isHR && (
            <button
              onClick={() => setCreating(true)}
              className="bg-white text-indigo-700 hover:bg-purple-50 px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" /> New Leave Request
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow p-4 flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {(['all', 'pending', 'approved', 'rejected', 'cancelled'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-full text-sm capitalize transition ${
                filter === k
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {k} <span className="opacity-70 text-xs">({counts[k]})</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Staff</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Dates</th>
                  <th className="px-4 py-3 text-left">Days</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500">Loading…</td></tr>
                ) : visible.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500">No leave requests in this view.</td></tr>
                ) : (
                  visible.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold flex items-center justify-center text-xs">
                            {l.staff.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                              {l.staff.full_name}
                              {l.staff.staff_type === 'rider' && <Bike className="w-3.5 h-3.5 text-orange-500" />}
                            </p>
                            <p className="text-xs text-gray-500">{l.staff.employee_code} · {l.staff.department ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize">{l.leave_type}{l.is_half_day && <span className="ml-1 text-xs text-amber-600">(½)</span>}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <CalendarRange className="w-4 h-4 text-gray-400" />
                          {l.start_date}{l.end_date !== l.start_date ? ` → ${l.end_date}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">{l.days_count}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs">
                        <span className="line-clamp-2">{l.reason || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[l.status]}`}>
                          <span className="inline-flex items-center gap-1">
                            {l.status === 'approved' && <Check className="w-3 h-3" />}
                            {l.status === 'rejected' && <X className="w-3 h-3" />}
                            {l.status === 'pending'  && <Clock className="w-3 h-3" />}
                            {l.status}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isHR && l.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              disabled={busy === l.id}
                              onClick={() => onReview(l.id, 'approved')}
                              className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              disabled={busy === l.id}
                              onClick={() => onReview(l.id, 'rejected')}
                              className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {creating && (
        <NewLeaveModal
          staff={staff}
          onClose={() => setCreating(false)}
          onCreated={async () => {
            setCreating(false)
            await refresh()
          }}
        />
      )}
    </DashboardLayout>
  )
}

function NewLeaveModal({
  staff,
  onClose,
  onCreated,
}: {
  staff: StaffMember[]
  onClose: () => void
  onCreated: () => void
}) {
  const [staffId, setStaffId] = useState(staff[0]?.id ?? '')
  const [leaveType, setLeaveType] = useState<LeaveType>('casual')
  const [startDate, setStartDate] = useState(today())
  const [endDate, setEndDate] = useState(today())
  const [isHalfDay, setIsHalfDay] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    if (!staffId) {
      setError('Please pick a staff member.')
      return
    }
    if (endDate < startDate) {
      setError('End date must be on or after start date.')
      return
    }
    setSubmitting(true)
    try {
      await createLeaveRequest({
        staff_id: staffId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: isHalfDay ? startDate : endDate,
        is_half_day: isHalfDay,
        reason: reason.trim(),
      })
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">New Leave Request</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <Field label="Staff">
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.employee_code} · {s.staff_type})
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm capitalize"
              >
                {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="">
              <label className="flex items-center gap-2 text-sm mt-6">
                <input type="checkbox" checked={isHalfDay} onChange={(e) => setIsHalfDay(e.target.checked)} />
                Half-day leave
              </label>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
            </Field>
            <Field label="End Date">
              <input
                type="date"
                value={isHalfDay ? startDate : endDate}
                disabled={isHalfDay}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              />
            </Field>
          </div>

          <Field label="Reason">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
              placeholder="Short reason (optional)"
            />
          </Field>

          {error && <p className="text-rose-600 text-sm">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          <button
            onClick={submit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      {label && <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>}
      <div className="mt-1">{children}</div>
    </label>
  )
}
