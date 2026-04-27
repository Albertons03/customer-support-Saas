import { useEffect, useMemo, useState } from 'react'
import { Bike, Plus, Search, Users, X, UserPlus } from 'lucide-react'
import { DashboardLayout } from '../components/DashboardLayout'
import { createStaff, listStaff } from '../lib/hr'
import { useProfile } from '../hooks/useProfile'
import type { StaffMember, StaffType } from '../types/hr'

export function Staff() {
  const { isHR } = useProfile()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | StaffType>('all')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      setStaff(await listStaff())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const visible = useMemo(() => {
    return staff
      .filter((s) => (filter === 'all' ? true : s.staff_type === filter))
      .filter((s) => {
        if (!query.trim()) return true
        const q = query.toLowerCase()
        return (
          s.full_name.toLowerCase().includes(q) ||
          (s.employee_code ?? '').toLowerCase().includes(q) ||
          (s.email ?? '').toLowerCase().includes(q) ||
          (s.department ?? '').toLowerCase().includes(q)
        )
      })
  }, [staff, filter, query])

  return (
    <DashboardLayout pageTitle="Staff & Riders">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/30 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/15 backdrop-blur p-3 rounded-xl"><Users className="w-7 h-7" /></div>
            <div>
              <h2 className="text-2xl font-bold">Staff & Riders</h2>
              <p className="text-purple-100 text-sm">Your full headcount across all departments.</p>
            </div>
          </div>
          {isHR && (
            <button
              onClick={() => setCreating(true)}
              className="bg-white text-indigo-700 hover:bg-purple-50 px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" /> Add Staff
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden text-sm">
            {(['all', 'staff', 'rider'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-3 py-2 capitalize ${
                  filter === k ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                }`}
              >
                {k === 'all' ? 'All' : k + 's'}
              </button>
            ))}
          </div>

          <div className="relative ml-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, code, department"
              className="pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm w-72"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Position</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Hired</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500">Loading…</td></tr>
                ) : visible.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500">No staff match.</td></tr>
                ) : visible.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold flex items-center justify-center text-xs">
                          {s.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                            {s.full_name}
                            {s.staff_type === 'rider' && <Bike className="w-3.5 h-3.5 text-orange-500" />}
                          </p>
                          <p className="text-xs text-gray-500">{s.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.employee_code}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        s.staff_type === 'rider' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>{s.staff_type}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{s.department ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{s.position ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.hire_date ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {creating && (
        <NewStaffModal
          onClose={() => setCreating(false)}
          onCreated={async () => { setCreating(false); await refresh() }}
        />
      )}
    </DashboardLayout>
  )
}

function NewStaffModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [staffType, setStaffType] = useState<StaffType>('staff')
  const [employeeCode, setEmployeeCode] = useState('')
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }
    setSubmitting(true)
    try {
      await createStaff({
        full_name: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        staff_type: staffType,
        employee_code: employeeCode.trim() || null,
        department: department.trim() || null,
        position: position.trim() || null,
      })
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create staff')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
            <UserPlus className="w-5 h-5" />
            <h3 className="text-lg font-bold">Add Staff Member</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Full name *">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
          </Field>
          <Field label="Type">
            <select value={staffType} onChange={(e) => setStaffType(e.target.value as StaffType)} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm capitalize">
              <option value="staff">staff</option>
              <option value="rider">rider</option>
            </select>
          </Field>
          <Field label="Employee code">
            <input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} placeholder="EMP-005" className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
          </Field>
          <Field label="Phone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
          </Field>
          <Field label="Email">
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
          </Field>
          <Field label="Department">
            <input value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
          </Field>
          <Field label="Position">
            <input value={position} onChange={(e) => setPosition(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
          </Field>
        </div>

        {error && <p className="text-rose-600 text-sm">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={submit} disabled={submitting} className="px-4 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow disabled:opacity-50">
            {submitting ? 'Saving…' : 'Add Staff'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}
