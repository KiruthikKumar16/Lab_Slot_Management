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

-- Function to update lab slot capacity
CREATE OR REPLACE FUNCTION update_lab_slot_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.lab_slots 
    SET current_bookings = current_bookings + 1,
        status = CASE 
          WHEN current_bookings + 1 >= max_capacity THEN 'full'
          ELSE 'available'
        END
    WHERE id = NEW.lab_slot_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.lab_slots 
    SET current_bookings = current_bookings - 1,
        status = CASE 
          WHEN current_bookings - 1 < max_capacity THEN 'available'
          ELSE 'full'
        END
    WHERE id = OLD.lab_slot_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_lab_slot_capacity_trigger ON public.bookings;

-- Trigger to update lab slot capacity
CREATE TRIGGER update_lab_slot_capacity_trigger
  AFTER INSERT OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_lab_slot_capacity();

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

-- Insert sample lab slots for the next few Sundays
INSERT INTO public.lab_slots (date, start_time, end_time, max_capacity, current_bookings, status) VALUES
('2025-08-10', '09:00:00', '12:00:00', 20, 0, 'available'),
('2025-08-10', '14:00:00', '17:00:00', 20, 0, 'available'),
('2025-08-17', '09:00:00', '12:00:00', 20, 0, 'available'),
('2025-08-17', '14:00:00', '17:00:00', 20, 0, 'available'),
('2025-08-24', '09:00:00', '12:00:00', 20, 0, 'available'),
('2025-08-24', '14:00:00', '17:00:00', 20, 0, 'available'),
('2025-08-31', '09:00:00', '12:00:00', 20, 0, 'available'),
('2025-08-31', '14:00:00', '17:00:00', 20, 0, 'available');

-- Insert sample user (your email) - let Supabase generate the ID
INSERT INTO public.users (email, name, role) VALUES
('kiruthikkumar.m2022@vitstudent.ac.in', 'Kiruthik Kumar', 'student')
ON CONFLICT (email) DO NOTHING;

-- Insert sample bookings for testing (will be added after user creation)
-- Note: These will be added by the application when you book slots

-- Add sample bookings for the user (after user creation)
-- This creates bookings for the existing user
INSERT INTO public.bookings (user_id, lab_slot_id, status, samples_submitted) 
SELECT u.id, ls.id, 'booked', 5
FROM public.users u, public.lab_slots ls 
WHERE u.email = 'kiruthikkumar.m2022@vitstudent.ac.in' 
AND ls.id IN (1, 3, 5, 7)
ON CONFLICT DO NOTHING;

-- Update lab slot capacities based on bookings
UPDATE public.lab_slots SET current_bookings = 1, status = 'available' WHERE id IN (1, 3, 5, 7); 