-- Lab Slot Management Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase Auth)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lab slots table
CREATE TABLE public.lab_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER DEFAULT 1 CHECK (capacity > 0),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'full', 'closed')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  lab_slot_id UUID REFERENCES public.lab_slots(id) ON DELETE CASCADE,
  booking_time TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'no-show')),
  checkin_time TIMESTAMP,
  samples_count INTEGER CHECK (samples_count >= 0),
  cancelled_by TEXT CHECK (cancelled_by IN ('self', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_lab_slot_id ON public.bookings(lab_slot_id);
CREATE INDEX idx_lab_slots_date ON public.lab_slots(date);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_users_email ON public.users(email);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Anyone can view lab slots (for booking)
CREATE POLICY "Anyone can view lab slots" ON public.lab_slots
  FOR SELECT USING (true);

-- Only admins can manage lab slots
CREATE POLICY "Only admins can manage lab slots" ON public.lab_slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own bookings
CREATE POLICY "Users can create own bookings" ON public.bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (user_id = auth.uid());

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage all bookings
CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically update slot status when bookings change
CREATE OR REPLACE FUNCTION update_slot_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update slot status based on booking count
  UPDATE public.lab_slots 
  SET status = CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM public.bookings 
      WHERE lab_slot_id = COALESCE(NEW.lab_slot_id, OLD.lab_slot_id)
      AND status = 'booked'
    ) >= (
      SELECT capacity 
      FROM public.lab_slots 
      WHERE id = COALESCE(NEW.lab_slot_id, OLD.lab_slot_id)
    )
    THEN 'full'
    ELSE 'available'
  END
  WHERE id = COALESCE(NEW.lab_slot_id, OLD.lab_slot_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update slot status
CREATE TRIGGER update_slot_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_slot_status();

-- Function to mark no-shows automatically
CREATE OR REPLACE FUNCTION mark_no_shows()
RETURNS void AS $$
BEGIN
  UPDATE public.bookings 
  SET status = 'no-show'
  WHERE status = 'booked'
  AND lab_slot_id IN (
    SELECT id FROM public.lab_slots 
    WHERE date < CURRENT_DATE
  )
  AND checkin_time IS NULL;
END;
$$ LANGUAGE plpgsql; 