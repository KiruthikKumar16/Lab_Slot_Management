-- =============================================================================
-- POPULATE TEST DATA FOR LAB SLOT MANAGEMENT SYSTEM
-- =============================================================================
-- This script adds comprehensive test data to test all features

-- =============================================================================
-- INSERT TEST USERS
-- =============================================================================

-- Insert admin user (you can change the email to your actual email)
INSERT INTO public.users (email, name, role, is_admin) VALUES
('admin@lab.com', 'Lab Administrator', 'admin', true),
('kiruthikkumar.m2022@vitstudent.ac.in', 'Kiruthik Kumar', 'student', false),
('student1@vitstudent.ac.in', 'John Doe', 'student', false),
('student2@vitstudent.ac.in', 'Jane Smith', 'student', false),
('student3@vitstudent.ac.in', 'Mike Johnson', 'student', false),
('student4@vitstudent.ac.in', 'Sarah Wilson', 'student', false),
('student5@vitstudent.ac.in', 'David Brown', 'student', false)
ON CONFLICT (email) DO UPDATE SET 
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_admin = EXCLUDED.is_admin;

-- =============================================================================
-- INSERT LAB SLOTS (for the next 2 weeks)
-- =============================================================================

-- Get current date and create slots for next 14 days
DO $$
DECLARE
    current_date_val DATE := CURRENT_DATE;
    slot_date DATE;
    admin_id INTEGER;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_id FROM public.users WHERE is_admin = true LIMIT 1;
    
    -- Create slots for next 14 days
    FOR i IN 0..13 LOOP
        slot_date := current_date_val + (i * INTERVAL '1 day');
        
        -- Morning slots (9 AM - 12 PM)
        INSERT INTO public.lab_slots (date, start_time, end_time, status, remarks) VALUES
        (slot_date, '09:00:00', '12:00:00', 'available', 'Morning session - General lab work'),
        (slot_date, '09:00:00', '11:00:00', 'available', 'Morning session - Sample preparation'),
        (slot_date, '10:00:00', '12:00:00', 'available', 'Morning session - Data analysis');
        
        -- Afternoon slots (2 PM - 5 PM)
        INSERT INTO public.lab_slots (date, start_time, end_time, status, remarks) VALUES
        (slot_date, '14:00:00', '17:00:00', 'available', 'Afternoon session - Equipment training'),
        (slot_date, '14:00:00', '16:00:00', 'available', 'Afternoon session - Research work'),
        (slot_date, '15:00:00', '17:00:00', 'available', 'Afternoon session - Project work');
        
        -- Evening slots (6 PM - 9 PM) for some days
        IF EXTRACT(DOW FROM slot_date) IN (1, 3, 5) THEN -- Monday, Wednesday, Friday
            INSERT INTO public.lab_slots (date, start_time, end_time, status, remarks) VALUES
            (slot_date, '18:00:00', '21:00:00', 'available', 'Evening session - Extended hours');
        END IF;
    END LOOP;
    
    -- Add some booked slots for testing
    -- Book some slots for today and tomorrow
    UPDATE public.lab_slots 
    SET status = 'booked', booked_by = (SELECT id FROM public.users WHERE email = 'student1@vitstudent.ac.in')
    WHERE date = current_date_val AND start_time = '09:00:00';
    
    UPDATE public.lab_slots 
    SET status = 'booked', booked_by = (SELECT id FROM public.users WHERE email = 'student2@vitstudent.ac.in')
    WHERE date = current_date_val + INTERVAL '1 day' AND start_time = '14:00:00';
    
    UPDATE public.lab_slots 
    SET status = 'booked', booked_by = (SELECT id FROM public.users WHERE email = 'student3@vitstudent.ac.in')
    WHERE date = current_date_val + INTERVAL '2 days' AND start_time = '10:00:00';
    
    -- Add some closed slots
    UPDATE public.lab_slots 
    SET status = 'closed'
    WHERE date = current_date_val + INTERVAL '3 days' AND start_time = '18:00:00';
    
END $$;

-- =============================================================================
-- INSERT BOOKINGS (to test booking functionality)
-- =============================================================================

-- Get some lab slot IDs and user IDs for bookings
DO $$
DECLARE
    slot1_id INTEGER;
    slot2_id INTEGER;
    slot3_id INTEGER;
    user1_id INTEGER;
    user2_id INTEGER;
    user3_id INTEGER;
BEGIN
    -- Get slot IDs
    SELECT id INTO slot1_id FROM public.lab_slots WHERE status = 'booked' AND booked_by = (SELECT id FROM public.users WHERE email = 'student1@vitstudent.ac.in') LIMIT 1;
    SELECT id INTO slot2_id FROM public.lab_slots WHERE status = 'booked' AND booked_by = (SELECT id FROM public.users WHERE email = 'student2@vitstudent.ac.in') LIMIT 1;
    SELECT id INTO slot3_id FROM public.lab_slots WHERE status = 'booked' AND booked_by = (SELECT id FROM public.users WHERE email = 'student3@vitstudent.ac.in') LIMIT 1;
    
    -- Get user IDs
    SELECT id INTO user1_id FROM public.users WHERE email = 'student1@vitstudent.ac.in';
    SELECT id INTO user2_id FROM public.users WHERE email = 'student2@vitstudent.ac.in';
    SELECT id INTO user3_id FROM public.users WHERE email = 'student3@vitstudent.ac.in';
    
    -- Insert bookings
    IF slot1_id IS NOT NULL AND user1_id IS NOT NULL THEN
        INSERT INTO public.bookings (user_id, lab_slot_id, status, samples_count) VALUES
        (user1_id, slot1_id, 'booked', 5);
    END IF;
    
    IF slot2_id IS NOT NULL AND user2_id IS NOT NULL THEN
        INSERT INTO public.bookings (user_id, lab_slot_id, status, samples_count) VALUES
        (user2_id, slot2_id, 'booked', 3);
    END IF;
    
    IF slot3_id IS NOT NULL AND user3_id IS NOT NULL THEN
        INSERT INTO public.bookings (user_id, lab_slot_id, status, samples_count) VALUES
        (user3_id, slot3_id, 'booked', 7);
    END IF;
    
    -- Add some past bookings for testing reports
    INSERT INTO public.bookings (user_id, lab_slot_id, status, samples_count, created_at) VALUES
    (user1_id, (SELECT id FROM public.lab_slots WHERE date < CURRENT_DATE LIMIT 1), 'booked', 4, CURRENT_DATE - INTERVAL '7 days'),
    (user2_id, (SELECT id FROM public.lab_slots WHERE date < CURRENT_DATE LIMIT 1 OFFSET 1), 'cancelled', 0, CURRENT_DATE - INTERVAL '5 days'),
    (user3_id, (SELECT id FROM public.lab_slots WHERE date < CURRENT_DATE LIMIT 1 OFFSET 2), 'no-show', 0, CURRENT_DATE - INTERVAL '3 days');
    
END $$;

-- =============================================================================
-- INSERT BOOKING SLOTS (for admin booking settings)
-- =============================================================================

-- Insert some booking slots for the next week
DO $$
DECLARE
    current_date_val DATE := CURRENT_DATE;
    slot_date DATE;
    admin_id INTEGER;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_id FROM public.users WHERE is_admin = true LIMIT 1;
    
    -- Create booking slots for next 7 days
    FOR i IN 0..6 LOOP
        slot_date := current_date_val + (i * INTERVAL '1 day');
        
        -- Regular booking slots (9 AM - 5 PM)
        INSERT INTO public.booking_slots (date, start_time, end_time, status, created_by) VALUES
        (slot_date, '09:00:00', '17:00:00', 'open', admin_id);
        
        -- Additional time windows for some days
        IF EXTRACT(DOW FROM slot_date) = 0 THEN -- Sunday
            INSERT INTO public.booking_slots (date, start_time, end_time, status, created_by) VALUES
            (slot_date, '10:00:00', '16:00:00', 'open', admin_id),
            (slot_date, '14:00:00', '18:00:00', 'open', admin_id);
        END IF;
        
        -- Evening slots for weekdays
        IF EXTRACT(DOW FROM slot_date) BETWEEN 1 AND 5 THEN -- Monday to Friday
            INSERT INTO public.booking_slots (date, start_time, end_time, status, created_by) VALUES
            (slot_date, '18:00:00', '20:00:00', 'closed', admin_id);
        END IF;
    END LOOP;
    
    -- Add some closed booking slots for testing
    UPDATE public.booking_slots 
    SET status = 'closed'
    WHERE date = current_date_val + INTERVAL '2 days' AND start_time = '14:00:00';
    
END $$;

-- =============================================================================
-- UPDATE BOOKING SYSTEM SETTINGS (for testing admin features)
-- =============================================================================

-- Update booking system settings with more realistic values
UPDATE public.booking_system_settings SET
  is_regular_booking_enabled = true,
  is_emergency_booking_open = false,
  emergency_booking_start = NULL,
  emergency_booking_end = NULL,
  emergency_allowed_days = ARRAY['monday', 'wednesday', 'friday'],
  regular_allowed_days = ARRAY['sunday'],
  message = 'Regular booking is available every Sunday from 9 AM to 5 PM. Emergency booking may be available on weekdays based on slot availability.',
  emergency_message = 'Emergency booking is currently open! You can book slots for today and tomorrow.',
  updated_by = (SELECT id FROM public.users WHERE is_admin = true LIMIT 1),
  updated_at = NOW()
WHERE id = 1;

-- =============================================================================
-- VERIFICATION QUERIES (run these to check the data)
-- =============================================================================

-- Check all users
-- SELECT * FROM public.users ORDER BY role, name;

-- Check lab slots for next 7 days
-- SELECT date, start_time, end_time, status, remarks FROM public.lab_slots 
-- WHERE date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
-- ORDER BY date, start_time;

-- Check bookings
-- SELECT b.id, u.name, u.email, ls.date, ls.start_time, ls.end_time, b.status, b.samples_count
-- FROM public.bookings b
-- JOIN public.users u ON b.user_id = u.id
-- JOIN public.lab_slots ls ON b.lab_slot_id = ls.id
-- ORDER BY ls.date DESC, ls.start_time;

-- Check booking slots
-- SELECT date, start_time, end_time, status FROM public.booking_slots
-- WHERE date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
-- ORDER BY date, start_time;

-- Check booking system settings
-- SELECT * FROM public.booking_system_settings;

-- =============================================================================
-- TEST DATA SUMMARY
-- =============================================================================

/*
TEST DATA CREATED:

1. USERS:
   - 1 Admin user (admin@lab.com)
   - 6 Student users with different emails

2. LAB SLOTS:
   - 14 days of slots (morning, afternoon, evening)
   - Some booked slots for testing
   - Some closed slots for testing
   - Mixed availability status

3. BOOKINGS:
   - Current bookings for active users
   - Past bookings for testing reports
   - Different statuses (booked, cancelled, no-show)
   - Sample counts for testing

4. BOOKING SLOTS:
   - 7 days of admin-controlled booking windows
   - Sunday-specific slots
   - Weekday evening slots
   - Mixed open/closed status

5. BOOKING SYSTEM SETTINGS:
   - Sunday-only regular booking
   - Emergency booking configuration
   - Custom messages

FEATURES TO TEST:

✅ User Authentication (Google OAuth)
✅ Admin Dashboard
✅ Student Dashboard  
✅ Lab Slots Management
✅ Booking System
✅ Booking Settings
✅ Reports Generation
✅ Sample Submission
✅ User Management

TEST SCENARIOS:

1. Login as admin and manage lab slots
2. Login as student and book slots
3. Test booking on Sunday vs weekdays
4. Submit samples for bookings
5. Generate reports
6. Test booking settings page
7. Test emergency booking features
8. Test slot editing and deletion
9. Test user role management

*/ 