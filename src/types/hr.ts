export type StaffType = 'staff' | 'rider'
export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'leave' | 'late'
export type LeaveType = 'sick' | 'casual' | 'annual' | 'unpaid' | 'other'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface StaffMember {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  staff_type: StaffType
  employee_code: string | null
  department: string | null
  position: string | null
  hire_date: string | null
  is_active: boolean
  avatar_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AttendanceRecord {
  id: string
  staff_id: string
  date: string
  status: AttendanceStatus
  check_in: string | null
  check_out: string | null
  notes: string | null
  recorded_by: string | null
  created_at: string
  updated_at: string
}

export interface LeaveRequest {
  id: string
  staff_id: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  is_half_day: boolean
  days_count: number
  reason: string | null
  status: LeaveStatus
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  created_at: string
  updated_at: string
}

export interface AttendanceWithStaff extends AttendanceRecord {
  staff: Pick<StaffMember, 'id' | 'full_name' | 'staff_type' | 'employee_code' | 'department' | 'position'>
}

export interface LeaveRequestWithStaff extends LeaveRequest {
  staff: Pick<StaffMember, 'id' | 'full_name' | 'staff_type' | 'employee_code' | 'department'>
}
