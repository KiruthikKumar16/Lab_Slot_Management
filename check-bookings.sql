-- =============================================================================
-- CHECK BOOKINGS DATA
-- =============================================================================
-- This script checks if there are any bookings in the database
-- and verifies the data structure.

-- Check if bookings table exists and has data
SELECT 'bookings' as table_name, COUNT(*) as total_count FROM public.bookings;

-- Check if lab_slots table has data
SELECT 'lab_slots' as table_name, COUNT(*) as total_count FROM public.lab_slots;

-- Check if users table has data
SELECT 'users' as table_name, COUNT(*) as total_count FROM public.users;

-- Show all bookings with details
SELECT 
  b.id as booking_id,
  b.status as booking_status,
  b.created_at as booking_created,
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

-- Show all lab slots with booking info
SELECT 
  ls.id as slot_id,
  ls.date,
  ls.start_time,
  ls.end_time,
  ls.status as slot_status,
  ls.booked_by,
  u.email as booked_by_email,
  b.id as booking_id,
  b.status as booking_status
FROM public.lab_slots ls
LEFT JOIN public.users u ON ls.booked_by = u.id
LEFT JOIN public.bookings b ON ls.id = b.lab_slot_id
ORDER BY ls.date, ls.start_time;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('bookings', 'lab_slots', 'users'); 