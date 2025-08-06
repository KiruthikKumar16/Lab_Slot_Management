-- =============================================================================
-- FIX RLS POLICIES FOR BOOKING SYSTEM
-- =============================================================================
-- This script fixes the RLS policies that are preventing admin operations

-- Drop existing policies for booking_slots
DROP POLICY IF EXISTS "Admins can read all booking slots" ON public.booking_slots;
DROP POLICY IF EXISTS "Admins can insert booking slots" ON public.booking_slots;
DROP POLICY IF EXISTS "Admins can update booking slots" ON public.booking_slots;
DROP POLICY IF EXISTS "Admins can delete booking slots" ON public.booking_slots;

-- Drop existing policies for booking_system_settings
DROP POLICY IF EXISTS "Anyone can view booking settings" ON public.booking_system_settings;
DROP POLICY IF EXISTS "Admins can manage booking settings" ON public.booking_system_settings;

-- Create new policies for booking_slots (admin only)
CREATE POLICY "Admins can read all booking slots" ON public.booking_slots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can insert booking slots" ON public.booking_slots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update booking slots" ON public.booking_slots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can delete booking slots" ON public.booking_slots
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.is_admin = true
    )
  );

-- Create new policies for booking_system_settings
CREATE POLICY "Anyone can view booking settings" ON public.booking_system_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage booking settings" ON public.booking_system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.is_admin = true
    )
  );

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check if policies were created successfully
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('booking_slots', 'booking_system_settings')
ORDER BY tablename, policyname;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('booking_slots', 'booking_system_settings'); 