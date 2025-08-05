import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables')
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface User {
  id: string
  email: string
  role: 'admin' | 'student'
  created_at: string
}

export interface LabSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  status: 'available' | 'booked' | 'closed'
  booked_by?: string
  remarks?: string
  created_at: string
}

export interface Booking {
  id: string
  user_id: string
  lab_slot_id: string
  booking_time: string
  status: 'booked' | 'cancelled' | 'no-show'
  checkin_time?: string
  samples_count?: number
  cancelled_by?: 'self' | 'admin'
  created_at: string
  // Joined data
  lab_slot?: LabSlot
  user?: User
} 