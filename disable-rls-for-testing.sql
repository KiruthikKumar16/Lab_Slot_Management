-- =============================================================================
-- DISABLE RLS FOR TESTING - NUCLEAR OPTION
-- =============================================================================
-- This script completely disables RLS on the booking tables for testing
-- WARNING: This removes all security restrictions - only use for testing!

-- Disable RLS on booking tables
ALTER TABLE public.booking_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_system_settings DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies (clean slate)
DROP POLICY IF EXISTS "Admins can read all booking slots" ON public.booking_slots;
DROP POLICY IF EXISTS "Admins can insert booking slots" ON public.booking_slots;
DROP POLICY IF EXISTS "Admins can update booking slots" ON public.booking_slots;
DROP POLICY IF EXISTS "Admins can delete booking slots" ON public.booking_slots;
DROP POLICY IF EXISTS "Allow all booking slots operations" ON public.booking_slots;

DROP POLICY IF EXISTS "Anyone can view booking settings" ON public.booking_system_settings;
DROP POLICY IF EXISTS "Admins can manage booking settings" ON public.booking_system_settings;
DROP POLICY IF EXISTS "Allow all booking settings operations" ON public.booking_system_settings;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('booking_slots', 'booking_system_settings');

-- Test insert into booking_system_settings
INSERT INTO public.booking_system_settings (
  is_regular_booking_enabled,
  is_emergency_booking_open,
  regular_allowed_days,
  message,
  emergency_message
) VALUES (
  true,
  false,
  ARRAY['sunday'],
  'RLS disabled for testing',
  'Emergency booking test message'
) ON CONFLICT (id) DO NOTHING;

-- Test insert into booking_slots
INSERT INTO public.booking_slots (
  date,
  start_time,
  end_time,
  status
) VALUES (
  CURRENT_DATE + INTERVAL '1 day',
  '09:00',
  '10:00',
  'open'
);

-- Verify inserts worked
SELECT 'booking_system_settings' as table_name, COUNT(*) as count FROM public.booking_system_settings
UNION ALL
SELECT 'booking_slots' as table_name, COUNT(*) as count FROM public.booking_slots; 