-- =====================================================
-- Fix RLS bugs uncovered while wiring up the HR module:
--   1. The "Admins/Agents can view workspace profiles" policy
--      from 001 selects from profiles inside a profiles policy
--      → infinite recursion on every profile lookup.
--   2. The HR FOR ALL policies (USING checks profiles) inherit
--      that recursion on every SELECT, breaking listStaff /
--      listAttendance / listLeaveRequests for everyone.
-- Approach: drop the recursive profile policy, replace HR
-- write policies with a SECURITY DEFINER helper that bypasses
-- RLS on profiles.
-- =====================================================

DROP POLICY IF EXISTS "Admins/Agents can view workspace profiles" ON public.profiles;

-- Helper: is the caller an HR manager or admin? Runs as definer
-- so the inner SELECT doesn't re-enter the profiles RLS engine.
CREATE OR REPLACE FUNCTION public.is_hr_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'hr_manager')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_hr_or_admin() TO authenticated;

-- ---- staff_members ----
DROP POLICY IF EXISTS "hr manage staff" ON public.staff_members;
CREATE POLICY "hr insert staff" ON public.staff_members
  FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_admin());
CREATE POLICY "hr update staff" ON public.staff_members
  FOR UPDATE TO authenticated USING (public.is_hr_or_admin()) WITH CHECK (public.is_hr_or_admin());
CREATE POLICY "hr delete staff" ON public.staff_members
  FOR DELETE TO authenticated USING (public.is_hr_or_admin());

-- ---- attendance ----
DROP POLICY IF EXISTS "hr manage attendance" ON public.attendance;
CREATE POLICY "hr insert attendance" ON public.attendance
  FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_admin());
CREATE POLICY "hr update attendance" ON public.attendance
  FOR UPDATE TO authenticated USING (public.is_hr_or_admin()) WITH CHECK (public.is_hr_or_admin());
CREATE POLICY "hr delete attendance" ON public.attendance
  FOR DELETE TO authenticated USING (public.is_hr_or_admin());

-- ---- leave_requests ----
DROP POLICY IF EXISTS "hr manage leaves" ON public.leave_requests;
CREATE POLICY "hr insert leaves" ON public.leave_requests
  FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_admin());
CREATE POLICY "hr update leaves" ON public.leave_requests
  FOR UPDATE TO authenticated USING (public.is_hr_or_admin()) WITH CHECK (public.is_hr_or_admin());
CREATE POLICY "hr delete leaves" ON public.leave_requests
  FOR DELETE TO authenticated USING (public.is_hr_or_admin());
