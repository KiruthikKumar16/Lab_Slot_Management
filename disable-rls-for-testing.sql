-- =============================================================================
-- TEMPORARY RLS DISABLE FOR TESTING
-- =============================================================================
-- This script temporarily disables RLS on the bookings table
-- so the admin can view all bookings for testing purposes.

-- Disable RLS on bookings table
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS on bookings table (run this when done testing)
-- ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY; 