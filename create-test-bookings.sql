-- =============================================================================
-- CREATE TEST BOOKINGS
-- =============================================================================
-- This script creates test bookings to populate the admin bookings page

-- First, let's check what we have
SELECT 'Current data count:' as info;
SELECT 'users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'lab_slots' as table_name, COUNT(*) as count FROM public.lab_slots
UNION ALL
SELECT 'bookings' as table_name, COUNT(*) as count FROM public.bookings;

-- Get user IDs for creating bookings
SELECT 'Available users:' as info;
SELECT id, email, name, role FROM public.users;

-- Get available lab slots
SELECT 'Available lab slots:' as info;
SELECT id, date, start_time, end_time, status FROM public.lab_slots WHERE status = 'available' ORDER BY date, start_time;

-- Create test bookings (only if we have users and slots)
INSERT INTO public.bookings (user_id, lab_slot_id, status, samples_count) 
SELECT 
  u.id as user_id,
  ls.id as lab_slot_id,
  'booked' as status,
  0 as samples_count
FROM public.users u
CROSS JOIN public.lab_slots ls
WHERE u.role = 'student' 
  AND ls.status = 'available'
  AND ls.date >= CURRENT_DATE
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
  WHERE status = 'booked'
);

-- Verify the bookings were created
SELECT 'Created bookings:' as info;
SELECT 
  b.id as booking_id,
  b.status as booking_status,
  u.email as user_email,
  u.name as user_name,
  ls.date as slot_date,
  ls.start_time,
  ls.end_time,
  ls.status as slot_status
FROM public.bookings b
LEFT JOIN public.users u ON b.user_id = u.id
LEFT JOIN public.lab_slots ls ON b.lab_slot_id = ls.id
ORDER BY b.created_at DESC;
