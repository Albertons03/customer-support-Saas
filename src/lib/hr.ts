import { supabase } from './supabase'
import type {
  StaffMember,
  AttendanceWithStaff,
  AttendanceStatus,
  LeaveRequestWithStaff,
  LeaveStatus,
  LeaveType,
} from '../types/hr'

const sb = supabase as unknown as {
  from: (table: string) => any
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: any; error: any }>
}

// ---------- Staff ----------
export async function listStaff(): Promise<StaffMember[]> {
  const { data, error } = await sb.from('staff_members').select('*').order('full_name')
  if (error) throw error
  return data as StaffMember[]
}

export async function createStaff(input: Partial<StaffMember>): Promise<StaffMember> {
  const { data, error } = await sb.from('staff_members').insert(input).select().single()
  if (error) throw error
  return data as StaffMember
}

// ---------- Attendance ----------
export async function listAttendance(date: string): Promise<AttendanceWithStaff[]> {
  const { data, error } = await sb
    .from('attendance')
    .select('*, staff:staff_members(id, full_name, staff_type, employee_code, department, position)')
    .eq('date', date)
    .order('staff(full_name)')
  if (error) throw error
  return (data ?? []) as AttendanceWithStaff[]
}

export async function listAttendanceRange(from: string, to: string): Promise<AttendanceWithStaff[]> {
  const { data, error } = await sb
    .from('attendance')
    .select('*, staff:staff_members(id, full_name, staff_type, employee_code, department, position)')
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []) as AttendanceWithStaff[]
}

export async function recordAttendance(
  staffId: string,
  status: AttendanceStatus,
  date: string,
): Promise<void> {
  const { error } = await sb.rpc('record_attendance', {
    p_staff_id: staffId,
    p_status: status,
    p_date: date,
  })
  if (error) throw error
}

// ---------- Leave ----------
export async function listLeaveRequests(): Promise<LeaveRequestWithStaff[]> {
  const { data, error } = await sb
    .from('leave_requests')
    .select('*, staff:staff_members(id, full_name, staff_type, employee_code, department)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as LeaveRequestWithStaff[]
}

export async function createLeaveRequest(input: {
  staff_id: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  is_half_day: boolean
  reason: string
}): Promise<void> {
  const { error } = await sb.from('leave_requests').insert(input)
  if (error) throw error
}

export async function reviewLeaveRequest(
  id: string,
  status: LeaveStatus,
  reviewerId: string,
  notes?: string,
): Promise<void> {
  const { error } = await sb
    .from('leave_requests')
    .update({
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes ?? null,
    })
    .eq('id', id)
  if (error) throw error
}
