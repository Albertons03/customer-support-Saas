-- =====================================================
-- HR Module: 009 — promote demo user + seed sample data
-- =====================================================

-- Promote the demo account (created during local setup) to hr_manager
UPDATE public.profiles
   SET role = 'hr_manager', full_name = COALESCE(full_name, 'Demo HR Manager')
 WHERE email = 'demo@local.test';

-- ---------- Seed staff & riders ----------
INSERT INTO public.staff_members (full_name, email, phone, staff_type, employee_code, department, position, hire_date)
VALUES
  ('Aarav Sharma',   'aarav@example.com',   '+977-9810000001', 'staff', 'EMP-001', 'Support',     'Senior Agent',  '2024-01-15'),
  ('Sita Karki',     'sita@example.com',    '+977-9810000002', 'staff', 'EMP-002', 'Support',     'Agent',         '2024-03-01'),
  ('Bishal Thapa',   'bishal@example.com',  '+977-9810000003', 'staff', 'EMP-003', 'Engineering', 'Developer',     '2023-08-12'),
  ('Anita Gurung',   'anita@example.com',   '+977-9810000004', 'staff', 'EMP-004', 'HR',          'HR Assistant',  '2024-05-20'),
  ('Rajesh Magar',   'rajesh@example.com',  '+977-9820000001', 'rider', 'RID-001', 'Logistics',   'Delivery Rider','2024-02-10'),
  ('Sunita Tamang',  'sunita@example.com',  '+977-9820000002', 'rider', 'RID-002', 'Logistics',   'Delivery Rider','2024-04-05'),
  ('Manish Rai',     'manish@example.com',  '+977-9820000003', 'rider', 'RID-003', 'Logistics',   'Senior Rider',  '2023-11-22');

-- ---------- Seed today's attendance ----------
WITH demo_hr AS (SELECT id FROM public.profiles WHERE email = 'demo@local.test' LIMIT 1)
INSERT INTO public.attendance (staff_id, date, status, check_in, check_out, recorded_by)
SELECT s.id, CURRENT_DATE, v.status::attendance_status, v.check_in::TIME, v.check_out::TIME, (SELECT id FROM demo_hr)
FROM (VALUES
  ('EMP-001', 'present',  '09:02', '18:05'),
  ('EMP-002', 'late',     '09:45', '18:10'),
  ('EMP-003', 'present',  '08:55', '17:50'),
  ('EMP-004', 'half_day', '09:00', '13:00'),
  ('RID-001', 'present',  '08:30', '17:00'),
  ('RID-002', 'leave',     NULL,    NULL),
  ('RID-003', 'absent',    NULL,    NULL)
) v(emp, status, check_in, check_out)
JOIN public.staff_members s ON s.employee_code = v.emp
LEFT JOIN demo_hr ON true
ON CONFLICT (staff_id, date) DO NOTHING;

-- A bit of attendance history (last 6 days) so the report has something to chart
WITH demo_hr AS (SELECT id FROM public.profiles WHERE email = 'demo@local.test' LIMIT 1),
     days   AS (SELECT generate_series(CURRENT_DATE - 6, CURRENT_DATE - 1, INTERVAL '1 day')::DATE AS d)
INSERT INTO public.attendance (staff_id, date, status, check_in, check_out, recorded_by)
SELECT
  s.id,
  d.d,
  (ARRAY['present','present','present','present','late','half_day','absent']::attendance_status[])
    [1 + (abs(hashtext(s.employee_code || d.d::text)) % 7)],
  '09:00'::TIME,
  '18:00'::TIME,
  (SELECT id FROM demo_hr)
FROM public.staff_members s
CROSS JOIN days d
ON CONFLICT (staff_id, date) DO NOTHING;

-- ---------- Seed leave requests ----------
INSERT INTO public.leave_requests (staff_id, leave_type, start_date, end_date, is_half_day, reason, status)
SELECT s.id, v.lt::leave_type, v.sd::DATE, v.ed::DATE, v.half, v.reason, v.st::leave_status
FROM (VALUES
  ('EMP-001','sick',   (CURRENT_DATE + 2)::TEXT, (CURRENT_DATE + 3)::TEXT, FALSE, 'Flu, doctor advised rest',           'pending'),
  ('EMP-002','casual', (CURRENT_DATE + 5)::TEXT, (CURRENT_DATE + 5)::TEXT, TRUE,  'Family event in the afternoon',      'pending'),
  ('EMP-003','annual', (CURRENT_DATE + 10)::TEXT,(CURRENT_DATE + 14)::TEXT,FALSE, 'Vacation — Pokhara trip',            'pending'),
  ('RID-001','casual', (CURRENT_DATE - 3)::TEXT, (CURRENT_DATE - 3)::TEXT, FALSE, 'Personal errand',                    'approved'),
  ('RID-002','sick',   (CURRENT_DATE)::TEXT,     (CURRENT_DATE)::TEXT,     FALSE, 'Stomach bug',                        'approved'),
  ('EMP-004','unpaid', (CURRENT_DATE - 10)::TEXT,(CURRENT_DATE - 8)::TEXT, FALSE, 'Family emergency',                   'rejected'),
  ('RID-003','casual', (CURRENT_DATE + 1)::TEXT, (CURRENT_DATE + 2)::TEXT, FALSE, 'Wedding in the village',             'pending')
) v(emp, lt, sd, ed, half, reason, st)
JOIN public.staff_members s ON s.employee_code = v.emp;
