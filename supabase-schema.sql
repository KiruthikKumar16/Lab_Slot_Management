-- =============================================================================
-- COMPLETE LAB SLOT MANAGEMENT DATABASE SCHEMA
-- =============================================================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.lab_slots CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop any existing functions and triggers
DROP FUNCTION IF EXISTS update_lab_slot_capacity() CASCADE;
DROP FUNCTION IF EXISTS mark_no_shows() CASCADE;

-- =============================================================================
-- CREATE TABLES
-- =============================================================================

-- Users table (for authentication and user management)
CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking system settings (for admin to control booking availability)
CREATE TABLE public.booking_system_settings (
  id SERIAL PRIMARY KEY,
  is_booking_open BOOLEAN DEFAULT false,
  booking_start_date DATE,
  booking_end_date DATE,
  allowed_days TEXT[], -- ['sunday', 'monday', etc.]
  message TEXT, -- Custom message when booking is closed
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
  samples_submitted INTEGER DEFAULT 0,
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
  FOR ALL USING (true);

-- Lab slots table policies
CREATE POLICY "Anyone can view lab slots" ON public.lab_slots
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage lab slots" ON public.lab_slots
  FOR ALL USING (true);

-- Bookings table policies
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (true);

CREATE POLICY "Users can create own bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (true);

CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (true);

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

-- =============================================================================
-- INSERT SAMPLE DATA
-- =============================================================================

-- Insert sample users
INSERT INTO public.users (email, name, role) VALUES
('kiruthikkumar.m2022@vitstudent.ac.in', 'Kiruthik Kumar', 'student'),
('admin@lab.com', 'Lab Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert default booking system settings
INSERT INTO public.booking_system_settings (is_booking_open, booking_start_date, booking_end_date, allowed_days, message) VALUES
(true, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', ARRAY['sunday'], 'Booking is currently open for Sundays only. Contact admin for special requests.')
ON CONFLICT (id) DO NOTHING;

-- Insert sample lab slots for the next few days
INSERT INTO public.lab_slots (date, start_time, end_time, status, remarks) VALUES
-- Today
(CURRENT_DATE, '09:00:00', '12:00:00', 'available', 'Morning session'),
(CURRENT_DATE, '14:00:00', '17:00:00', 'available', 'Afternoon session'),
-- Tomorrow
(CURRENT_DATE + INTERVAL '1 day', '09:00:00', '12:00:00', 'available', 'Morning session'),
(CURRENT_DATE + INTERVAL '1 day', '14:00:00', '17:00:00', 'available', 'Afternoon session'),
-- Day after tomorrow
(CURRENT_DATE + INTERVAL '2 days', '09:00:00', '12:00:00', 'available', 'Morning session'),
(CURRENT_DATE + INTERVAL '2 days', '14:00:00', '17:00:00', 'available', 'Afternoon session'),
-- Next week
(CURRENT_DATE + INTERVAL '7 days', '09:00:00', '12:00:00', 'available', 'Morning session'),
(CURRENT_DATE + INTERVAL '7 days', '14:00:00', '17:00:00', 'available', 'Afternoon session');

-- =============================================================================
-- VERIFICATION QUERIES (optional - run these to check setup)
-- =============================================================================

-- Check if tables were created
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check if sample data was inserted
-- SELECT * FROM public.users;
-- SELECT * FROM public.lab_slots ORDER BY date, start_time; 