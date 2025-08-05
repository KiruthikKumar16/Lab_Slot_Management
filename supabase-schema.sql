-- Create users table (without Supabase auth dependency)
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lab_slots table
CREATE TABLE IF NOT EXISTS public.lab_slots (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INTEGER DEFAULT 20,
  current_bookings INTEGER DEFAULT 0,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'full', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Insert sample data
INSERT INTO public.users (email, name, role) VALUES
  ('admin.lab@university.edu', 'Admin User', 'admin'),
  ('john.doe@university.edu', 'John Doe', 'student')
ON CONFLICT (email) DO NOTHING;

-- Insert sample lab slots for the next 4 weeks (Sundays only)
INSERT INTO public.lab_slots (date, start_time, end_time, max_capacity) VALUES
  (CURRENT_DATE + INTERVAL '1 day' * (7 - EXTRACT(DOW FROM CURRENT_DATE)::int), '09:00', '12:00', 20),
  (CURRENT_DATE + INTERVAL '1 day' * (14 - EXTRACT(DOW FROM CURRENT_DATE)::int), '09:00', '12:00', 20),
  (CURRENT_DATE + INTERVAL '1 day' * (21 - EXTRACT(DOW FROM CURRENT_DATE)::int), '09:00', '12:00', 20),
  (CURRENT_DATE + INTERVAL '1 day' * (28 - EXTRACT(DOW FROM CURRENT_DATE)::int), '09:00', '12:00', 20)
ON CONFLICT DO NOTHING; 