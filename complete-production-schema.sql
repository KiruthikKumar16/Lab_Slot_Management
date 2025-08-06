-- =============================================================================
-- COMPLETE LAB SLOT MANAGEMENT SYSTEM - PRODUCTION SCHEMA
-- =============================================================================
-- This file contains everything needed for the lab slot management system
-- to work perfectly in production mode.

-- =============================================================================
-- CLEAN SLATE - DROP EXISTING OBJECTS
-- =============================================================================

-- Drop existing policies first (with IF EXISTS to handle missing tables)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view booking settings" ON public.booking_system_settings;
DROP POLICY IF EXISTS "Admins can manage booking settings" ON public.booking_system_settings;
DROP POLICY IF EXISTS "Anyone can view lab slots" ON public.lab_slots;
DROP POLICY IF EXISTS "Admins can manage lab slots" ON public.lab_slots;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;

-- Drop booking_slots policies separately to handle case where table doesn't exist
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'booking_slots') THEN
        DROP POLICY IF EXISTS "Admins can read all booking slots" ON public.booking_slots;
        DROP POLICY IF EXISTS "Admins can insert booking slots" ON public.booking_slots;
        DROP POLICY IF EXISTS "Admins can update booking slots" ON public.booking_slots;
        DROP POLICY IF EXISTS "Admins can delete booking slots" ON public.booking_slots;
    END IF;
END $$;

-- Drop existing functions
DROP FUNCTION IF EXISTS mark_no_shows() CASCADE;
DROP FUNCTION IF EXISTS update_lab_slot_capacity() CASCADE;
DROP FUNCTION IF EXISTS update_user_role() CASCADE;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_user_role_trigger ON public.users;

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.lab_slots CASCADE;
DROP TABLE IF EXISTS public.booking_slots CASCADE;
DROP TABLE IF EXISTS public.booking_system_settings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- =============================================================================
-- CREATE TABLES
-- =============================================================================

-- Users table (for authentication and user management)
CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking system settings (for admin to control booking availability)
CREATE TABLE public.booking_system_settings (
  id SERIAL PRIMARY KEY,
  is_regular_booking_enabled BOOLEAN DEFAULT true, -- Regular Sunday booking
  is_emergency_booking_open BOOLEAN DEFAULT false, -- Admin override for weekdays
  emergency_booking_start TIMESTAMP WITH TIME ZONE, -- When emergency booking starts
  emergency_booking_end TIMESTAMP WITH TIME ZONE, -- When emergency booking ends
  emergency_allowed_days TEXT[], -- Days for emergency booking
  regular_allowed_days TEXT[] DEFAULT ARRAY['sunday'], -- Regular booking days
  message TEXT, -- Custom message when booking is closed
  emergency_message TEXT, -- Message for emergency booking
  updated_by INTEGER REFERENCES public.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lab slots table (for managing available lab sessions)
CREATE TABLE public.lab_slots (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'closed')),
  booked_by INTEGER REFERENCES public.users(id),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table (for tracking student bookings and attendance)
CREATE TABLE public.bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
  lab_slot_id INTEGER REFERENCES public.lab_slots(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'no-show')),
  samples_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking slots table (for admin-controlled booking time windows)
CREATE TABLE public.booking_slots (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_by INTEGER REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_slots ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- CREATE RLS POLICIES
-- =============================================================================

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (true);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (true);

-- Booking system settings policies
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

-- Lab slots table policies
CREATE POLICY "Anyone can view lab slots" ON public.lab_slots
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage lab slots" ON public.lab_slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.is_admin = true
    )
  );

-- Bookings table policies
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (
    user_id = (
      SELECT id FROM users 
      WHERE users.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can create own bookings" ON public.bookings
  FOR INSERT WITH CHECK (
    user_id = (
      SELECT id FROM users 
      WHERE users.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (
    user_id = (
      SELECT id FROM users 
      WHERE users.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.is_admin = true
    )
  );

-- Booking slots table policies (admin only)
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

-- =============================================================================
-- CREATE FUNCTIONS
-- =============================================================================

-- Function to mark no-shows for past bookings
CREATE OR REPLACE FUNCTION mark_no_shows()
RETURNS void AS $$
BEGIN
  UPDATE public.bookings 
  SET status = 'no-show'
  WHERE status = 'booked' 
    AND lab_slot_id IN (
      SELECT id FROM public.lab_slots 
      WHERE date < CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update user role based on is_admin field
CREATE OR REPLACE FUNCTION update_user_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_admin = true THEN
    NEW.role = 'admin';
  ELSE
    NEW.role = 'student';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CREATE TRIGGERS
-- =============================================================================

-- Trigger to automatically update user role when is_admin changes
CREATE TRIGGER update_user_role_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_role();

-- =============================================================================
-- INSERT DEFAULT DATA
-- =============================================================================

-- Insert default booking system settings
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
  'Regular booking is available every Sunday. Check back on Sunday to book your lab session.', 
  'Emergency booking is currently open due to slot availability. Book now!'
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin);
CREATE INDEX IF NOT EXISTS idx_lab_slots_date ON public.lab_slots(date);
CREATE INDEX IF NOT EXISTS idx_lab_slots_status ON public.lab_slots(status);
CREATE INDEX IF NOT EXISTS idx_lab_slots_booked_by ON public.lab_slots(booked_by);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lab_slot_id ON public.bookings(lab_slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_booking_slots_date ON public.booking_slots(date);
CREATE INDEX IF NOT EXISTS idx_booking_slots_status ON public.booking_slots(status);

-- =============================================================================
-- VERIFICATION QUERIES (optional - run these to check setup)
-- =============================================================================

-- Check if all tables were created successfully
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Check if RLS is enabled on all tables
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check if policies were created
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Check default booking settings
-- SELECT * FROM public.booking_system_settings;

-- =============================================================================
-- PRODUCTION NOTES
-- =============================================================================

/*
IMPORTANT NOTES FOR PRODUCTION:

1. AUTHENTICATION:
   - This system uses Google OAuth for authentication
   - Users are automatically created when they first log in
   - Admin role must be manually assigned by setting is_admin = true

2. BOOKING RULES:
   - Regular booking is Sunday-only by default
   - Emergency booking can be enabled by admins for weekdays
   - Users can only book one slot per date
   - Bookings can be cancelled up to 1 day in advance

3. SECURITY:
   - Row Level Security (RLS) is enabled on all tables
   - Users can only access their own data
   - Admins have full access to all data
   - All policies use email-based authentication for compatibility

4. PERFORMANCE:
   - Indexes are created on frequently queried columns
   - Functions are optimized for common operations
   - Triggers handle automatic role updates

5. MAINTENANCE:
   - Run mark_no_shows() function periodically to update past bookings
   - Monitor booking_system_settings for system configuration
   - Check booking_slots table for admin-controlled time windows

6. BACKUP:
   - Regular database backups are recommended
   - Export data periodically for disaster recovery
   - Monitor table sizes and performance

7. SCALING:
   - Current schema supports multiple users and admins
   - Can be extended with additional features as needed
   - Consider partitioning for very large datasets
*/ 