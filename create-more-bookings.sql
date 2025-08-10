-- =============================================================================
-- CREATE MORE DIVERSE TEST BOOKINGS
-- =============================================================================
-- This script creates additional test bookings with different dates and statuses

-- First, let's see what we currently have
SELECT 'Current bookings:' as info;
SELECT 
  b.id as booking_id,
  b.status as booking_status,
  u.email as user_email,
  ls.date as slot_date,
  ls.start_time,
  ls.end_time
FROM public.bookings b
LEFT JOIN public.users u ON b.user_id = u.id
LEFT JOIN public.lab_slots ls ON b.lab_slot_id = ls.id
ORDER BY b.created_at DESC;

-- Create more lab slots for different dates
INSERT INTO public.lab_slots (date, start_time, end_time, status, remarks) VALUES
-- Past dates (for completed/cancelled bookings)
(CURRENT_DATE - INTERVAL '7 days', '09:00:00', '12:00:00', 'available', 'Past session 1'),
(CURRENT_DATE - INTERVAL '7 days', '14:00:00', '17:00:00', 'available', 'Past session 2'),
(CURRENT_DATE - INTERVAL '5 days', '09:00:00', '12:00:00', 'available', 'Past session 3'),
(CURRENT_DATE - INTERVAL '3 days', '14:00:00', '17:00:00', 'available', 'Past session 4'),
-- Future dates
(CURRENT_DATE + INTERVAL '2 days', '09:00:00', '12:00:00', 'available', 'Future session 1'),
(CURRENT_DATE + INTERVAL '2 days', '14:00:00', '17:00:00', 'available', 'Future session 2'),
(CURRENT_DATE + INTERVAL '5 days', '09:00:00', '12:00:00', 'available', 'Future session 3'),
(CURRENT_DATE + INTERVAL '7 days', '14:00:00', '17:00:00', 'available', 'Future session 4'),
(CURRENT_DATE + INTERVAL '10 days', '09:00:00', '12:00:00', 'available', 'Future session 5'),
(CURRENT_DATE + INTERVAL '14 days', '14:00:00', '17:00:00', 'available', 'Future session 6')
ON CONFLICT DO NOTHING;

-- Create bookings with different statuses
INSERT INTO public.bookings (user_id, lab_slot_id, status, samples_count) 
SELECT 
  u.id as user_id,
  ls.id as lab_slot_id,
  CASE 
    WHEN ls.date < CURRENT_DATE THEN 'completed'  -- Past dates = completed
    WHEN ls.date = CURRENT_DATE + INTERVAL '2 days' THEN 'booked'  -- Near future = booked
    ELSE 'booked'  -- Far future = booked
  END as status,
  CASE 
    WHEN ls.date < CURRENT_DATE THEN FLOOR(RANDOM() * 5) + 1  -- Random samples for completed
    ELSE 0  -- No samples for future bookings
  END as samples_count
FROM public.users u
CROSS JOIN public.lab_slots ls
WHERE u.role = 'student' 
  AND ls.status = 'available'
  AND ls.date >= CURRENT_DATE - INTERVAL '7 days'
  AND ls.date <= CURRENT_DATE + INTERVAL '14 days'
  AND ls.id NOT IN (SELECT lab_slot_id FROM public.bookings)  -- Don't duplicate existing bookings
LIMIT 10;

-- Create some cancelled and no-show bookings
INSERT INTO public.bookings (user_id, lab_slot_id, status, samples_count) 
SELECT 
  u.id as user_id,
  ls.id as lab_slot_id,
  CASE 
    WHEN RANDOM() > 0.7 THEN 'cancelled'
    ELSE 'no-show'
  END as status,
  0 as samples_count
FROM public.users u
CROSS JOIN public.lab_slots ls
WHERE u.role = 'student' 
  AND ls.status = 'available'
  AND ls.date < CURRENT_DATE - INTERVAL '10 days'  -- Old slots for cancelled/no-show
  AND ls.id NOT IN (SELECT lab_slot_id FROM public.bookings)
LIMIT 3;

-- Update lab slots to show as booked
UPDATE public.lab_slots 
SET status = 'booked', booked_by = (
  SELECT u.id FROM public.users u 
  WHERE u.role = 'student' 
  LIMIT 1
)
WHERE id IN (
  SELECT lab_slot_id FROM public.bookings 
  WHERE status IN ('booked', 'completed')
);

-- Show final results
SELECT 'Final booking summary:' as info;
SELECT 
  b.status as booking_status,
  COUNT(*) as count
FROM public.bookings b
GROUP BY b.status
ORDER BY b.status;

SELECT 'All bookings with details:' as info;
SELECT 
  b.id as booking_id,
  b.status as booking_status,
  b.samples_count,
  u.email as user_email,
  u.name as user_name,
  ls.date as slot_date,
  ls.start_time,
  ls.end_time,
  ls.status as slot_status,
  ls.remarks
FROM public.bookings b
LEFT JOIN public.users u ON b.user_id = u.id
LEFT JOIN public.lab_slots ls ON b.lab_slot_id = ls.id
ORDER BY ls.date DESC, ls.start_time;

