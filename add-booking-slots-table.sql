-- Add booking_slots table for storing booking time slots
CREATE TABLE IF NOT EXISTS booking_slots (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for booking_slots
ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all booking slots
CREATE POLICY "Admins can read all booking slots" ON booking_slots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.is_admin = true
    )
  );

-- Allow admins to insert booking slots
CREATE POLICY "Admins can insert booking slots" ON booking_slots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.is_admin = true
    )
  );

-- Allow admins to update booking slots
CREATE POLICY "Admins can update booking slots" ON booking_slots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.is_admin = true
    )
  );

-- Allow admins to delete booking slots
CREATE POLICY "Admins can delete booking slots" ON booking_slots
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.is_admin = true
    )
  );

-- Insert some sample booking slots
INSERT INTO booking_slots (date, start_time, end_time, status, created_by) VALUES
  ('2025-08-10', '09:00', '11:00', 'open', 1),
  ('2025-08-11', '14:00', '16:00', 'open', 1),
  ('2025-08-13', '10:00', '12:00', 'closed', 1)
ON CONFLICT DO NOTHING; 