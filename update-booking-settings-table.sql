-- Safe update script for existing booking_system_settings table
-- Run this instead of the full schema if you get "relation already exists" error

-- First, let's check what columns exist and add missing ones
DO $$ 
BEGIN
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'booking_system_settings' AND column_name = 'is_regular_booking_enabled') THEN
        ALTER TABLE public.booking_system_settings ADD COLUMN is_regular_booking_enabled BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'booking_system_settings' AND column_name = 'is_emergency_booking_open') THEN
        ALTER TABLE public.booking_system_settings ADD COLUMN is_emergency_booking_open BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'booking_system_settings' AND column_name = 'emergency_booking_start') THEN
        ALTER TABLE public.booking_system_settings ADD COLUMN emergency_booking_start TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'booking_system_settings' AND column_name = 'emergency_booking_end') THEN
        ALTER TABLE public.booking_system_settings ADD COLUMN emergency_booking_end TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'booking_system_settings' AND column_name = 'emergency_allowed_days') THEN
        ALTER TABLE public.booking_system_settings ADD COLUMN emergency_allowed_days TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'booking_system_settings' AND column_name = 'regular_allowed_days') THEN
        ALTER TABLE public.booking_system_settings ADD COLUMN regular_allowed_days TEXT[] DEFAULT ARRAY['sunday'];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'booking_system_settings' AND column_name = 'emergency_message') THEN
        ALTER TABLE public.booking_system_settings ADD COLUMN emergency_message TEXT;
    END IF;
END $$;

-- Update existing data to new structure
UPDATE public.booking_system_settings 
SET 
    is_regular_booking_enabled = COALESCE(is_booking_open, true),
    regular_allowed_days = COALESCE(allowed_days, ARRAY['sunday']),
    emergency_message = COALESCE(emergency_message, 'Emergency booking is currently open due to slot availability. Book now!')
WHERE id = 1;

-- Insert default settings if no record exists
INSERT INTO public.booking_system_settings (
    is_regular_booking_enabled, 
    is_emergency_booking_open, 
    regular_allowed_days, 
    message, 
    emergency_message
) 
SELECT 
    true, 
    false, 
    ARRAY['sunday'], 
    'Regular booking is available every Sunday. Check back on Sunday to book your lab session.',
    'Emergency booking is currently open due to slot availability. Book now!'
WHERE NOT EXISTS (SELECT 1 FROM public.booking_system_settings);

-- Clean up old columns if they exist (optional, uncomment if you want to remove them)
-- ALTER TABLE public.booking_system_settings DROP COLUMN IF EXISTS is_booking_open;
-- ALTER TABLE public.booking_system_settings DROP COLUMN IF EXISTS booking_start_date;
-- ALTER TABLE public.booking_system_settings DROP COLUMN IF EXISTS booking_end_date;
-- ALTER TABLE public.booking_system_settings DROP COLUMN IF EXISTS allowed_days;

-- Verify the update
SELECT * FROM public.booking_system_settings;