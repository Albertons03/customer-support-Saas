-- =====================================================
-- HR Module: 008 — staff, attendance, leave_requests
-- =====================================================

CREATE TYPE staff_type        AS ENUM ('staff', 'rider');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'half_day', 'leave', 'late');
CREATE TYPE leave_type        AS ENUM ('sick', 'casual', 'annual', 'unpaid', 'other');
CREATE TYPE leave_status      AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- ---------- staff_members ----------
CREATE TABLE public.staff_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name       TEXT NOT NULL,
  email           TEXT UNIQUE,
  phone           TEXT,
  staff_type      staff_type NOT NULL DEFAULT 'staff',
  employee_code   TEXT UNIQUE,
  department      TEXT,
  position        TEXT,
  hire_date       DATE DEFAULT CURRENT_DATE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_url      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_members_type   ON public.staff_members(staff_type);
CREATE INDEX idx_staff_members_active ON public.staff_members(is_active);

CREATE TRIGGER staff_members_updated_at
  BEFORE UPDATE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------- attendance ----------
CREATE TABLE public.attendance (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id     UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  status       attendance_status NOT NULL,
  check_in     TIME,
  check_out    TIME,
  notes        TEXT,
  recorded_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (staff_id, date)
);

CREATE INDEX idx_attendance_staff_id ON public.attendance(staff_id);
CREATE INDEX idx_attendance_date     ON public.attendance(date DESC);
CREATE INDEX idx_attendance_status   ON public.attendance(status);

CREATE TRIGGER attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------- leave_requests ----------
CREATE TABLE public.leave_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id      UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  leave_type    leave_type   NOT NULL DEFAULT 'casual',
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  is_half_day   BOOLEAN NOT NULL DEFAULT FALSE,
  days_count    NUMERIC(4,1) GENERATED ALWAYS AS (
                  CASE WHEN is_half_day THEN 0.5
                       ELSE (end_date - start_date + 1)::NUMERIC END
                ) STORED,
  reason        TEXT,
  status        leave_status NOT NULL DEFAULT 'pending',
  reviewed_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMPTZ,
  review_notes  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT leave_dates_valid CHECK (end_date >= start_date)
);

CREATE INDEX idx_leave_requests_staff_id  ON public.leave_requests(staff_id);
CREATE INDEX idx_leave_requests_status    ON public.leave_requests(status);
CREATE INDEX idx_leave_requests_created   ON public.leave_requests(created_at DESC);

CREATE TRIGGER leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS — keep simple for the demo:
--   * Any authenticated user can SELECT (so the dashboard works).
--   * admin / hr_manager can do everything else.
-- =====================================================

ALTER TABLE public.staff_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read staff"      ON public.staff_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr manage staff"      ON public.staff_members
  FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','hr_manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','hr_manager')));

CREATE POLICY "auth read attendance" ON public.attendance
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr manage attendance" ON public.attendance
  FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','hr_manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','hr_manager')));

CREATE POLICY "auth read leaves"     ON public.leave_requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr manage leaves"     ON public.leave_requests
  FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','hr_manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','hr_manager')));

-- =====================================================
-- Helper: upsert a single attendance record for today (or any date).
-- =====================================================
CREATE OR REPLACE FUNCTION public.record_attendance(
  p_staff_id  UUID,
  p_status    attendance_status,
  p_date      DATE DEFAULT CURRENT_DATE,
  p_check_in  TIME DEFAULT NULL,
  p_check_out TIME DEFAULT NULL,
  p_notes     TEXT DEFAULT NULL
) RETURNS public.attendance
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_row public.attendance;
BEGIN
  INSERT INTO public.attendance(staff_id, date, status, check_in, check_out, notes, recorded_by)
  VALUES (p_staff_id, p_date, p_status, p_check_in, p_check_out, p_notes, auth.uid())
  ON CONFLICT (staff_id, date) DO UPDATE
    SET status      = EXCLUDED.status,
        check_in    = COALESCE(EXCLUDED.check_in,  public.attendance.check_in),
        check_out   = COALESCE(EXCLUDED.check_out, public.attendance.check_out),
        notes       = EXCLUDED.notes,
        recorded_by = EXCLUDED.recorded_by,
        updated_at  = NOW()
  RETURNING * INTO v_row;
  RETURN v_row;
END $$;
