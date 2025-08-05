-- Create users table (without Supabase auth dependency)
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lab Slots table
CREATE TABLE IF NOT EXISTS lab_slots (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'closed')),
  booked_by INTEGER REFERENCES users(id),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
  lab_slot_id INTEGER REFERENCES public.lab_slots(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'no-show')),
  samples_submitted INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

DROP POLICY IF EXISTS "Anyone can view lab slots" ON public.lab_slots;
DROP POLICY IF EXISTS "Admins can manage lab slots" ON public.lab_slots;

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (true);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (true);

-- RLS Policies for lab_slots table
CREATE POLICY "Anyone can view lab slots" ON public.lab_slots
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage lab slots" ON public.lab_slots
  FOR ALL USING (true);

-- RLS Policies for bookings table
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (true);

CREATE POLICY "Users can create own bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (true);

CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (true);

-- Function to mark no-shows
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

-- Insert sample lab slots for the next few days
INSERT INTO public.lab_slots (date, start_time, end_time, status, remarks) VALUES
('2025-01-20', '09:00:00', '12:00:00', 'available', 'Morning session'),
('2025-01-20', '14:00:00', '17:00:00', 'available', 'Afternoon session'),
('2025-01-21', '09:00:00', '12:00:00', 'available', 'Morning session'),
('2025-01-21', '14:00:00', '17:00:00', 'available', 'Afternoon session'),
('2025-01-22', '09:00:00', '12:00:00', 'available', 'Morning session'),
('2025-01-22', '14:00:00', '17:00:00', 'available', 'Afternoon session'),
('2025-01-23', '09:00:00', '12:00:00', 'available', 'Morning session'),
('2025-01-23', '14:00:00', '17:00:00', 'available', 'Afternoon session');

-- Insert sample user (your email) - let Supabase generate the ID
INSERT INTO public.users (email, name, role) VALUES
('kiruthikkumar.m2022@vitstudent.ac.in', 'Kiruthik Kumar', 'student')
ON CONFLICT (email) DO NOTHING; 