import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    // Check Google OAuth session
    const cookieStore = cookies()
    const accessToken = cookieStore.get('google_access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token with Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })

    if (!userInfoResponse.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userInfo = await userInfoResponse.json()

    // Get user from database
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', userInfo.email)
      .single()

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Enforce booking settings (regular/emergency rules)
    const { data: settings } = await supabaseAdmin
      .from('booking_system_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const isBookingAllowed = () => {
      if (!settings) return false
      const now = new Date()
      const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
      const currentDay = dayNames[now.getDay()]
      // Emergency window
      if (settings.is_emergency_booking_open) {
        const emergencyStart = settings.emergency_booking_start ? new Date(settings.emergency_booking_start) : null
        const emergencyEnd = settings.emergency_booking_end ? new Date(settings.emergency_booking_end) : null
        if (emergencyStart && emergencyEnd && now >= emergencyStart && now <= emergencyEnd) {
          if (!settings.emergency_allowed_days || settings.emergency_allowed_days.includes(currentDay)) return true
        }
      }
      // Regular schedule by day
      if (settings.is_regular_booking_enabled) {
        if (settings.regular_allowed_days && settings.regular_allowed_days.includes(currentDay)) return true
      }
      return false
    }

    if (!isBookingAllowed()) {
      return NextResponse.json({ error: 'Booking is currently closed' }, { status: 403 })
    }

    const { lab_slot_id } = await request.json()

    if (!lab_slot_id) {
      return NextResponse.json({ error: 'Lab slot ID is required' }, { status: 400 })
    }

    // Check if slot exists and is available
    const { data: slot, error: slotError } = await supabaseAdmin
      .from('lab_slots')
      .select('*')
      .eq('id', lab_slot_id)
      .single()

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
    }

    if (slot.status !== 'available') {
      return NextResponse.json({ error: 'Slot is not available' }, { status: 400 })
    }

    // Check if slot date is in the future
    const slotDate = new Date(slot.date)
    if (slotDate < new Date()) {
      return NextResponse.json({ error: 'Cannot book past slots' }, { status: 400 })
    }

    // Check if user already has a booking for this date
    const { data: existingBooking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('user_id', dbUser.id)
      .eq('lab_slot_id', lab_slot_id)
      .eq('status', 'booked')
      .single()

    if (existingBooking) {
      return NextResponse.json(
        { error: 'You already have a booking for this slot' }, 
        { status: 400 }
      )
    }

    // Check if user has any booking for the same date
    const { data: sameDateBooking } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        lab_slot!inner(date)
      `)
      .eq('user_id', dbUser.id)
      .eq('status', 'booked')
      .eq('lab_slot.date', slot.date)
      .single()

    if (sameDateBooking) {
      return NextResponse.json(
        { error: 'You already have a booking for this date' }, 
        { status: 400 }
      )
    }

    // Create booking
    // Atomically book: mark slot booked and create booking within server operations
    const { data: updatedSlot, error: slotUpdateErr } = await supabaseAdmin
      .from('lab_slots')
      .update({ status: 'booked', booked_by: dbUser.id })
      .eq('id', lab_slot_id)
      .eq('status', 'available')
      .is('booked_by', null)
      .select('id')
      .single()

    if (slotUpdateErr || !updatedSlot) {
      return NextResponse.json({ error: 'Slot just became unavailable' }, { status: 409 })
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        user_id: dbUser.id,
        lab_slot_id,
        status: 'booked'
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Booking error:', bookingError)
      return NextResponse.json({ error: 'Booking failed' }, { status: 500 })
    }

    return NextResponse.json({ 
      booking,
      message: 'Booking successful!' 
    })
  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    // Check Google OAuth session
    const cookieStore = cookies()
    const accessToken = cookieStore.get('google_access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token with Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })

    if (!userInfoResponse.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userInfo = await userInfoResponse.json()

    // Get user from database
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', userInfo.email)
      .single()

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    let query = supabaseAdmin
      .from('bookings')
      .select(`
        *,
        lab_slot (*),
        user!inner(email, role)
      `)

    // If user_id is provided and user is admin, allow viewing other bookings
    if (user_id) {
      if (dbUser.role === 'admin') {
        query = query.eq('user_id', user_id)
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else {
      // Regular users can only see their own bookings
      query = query.eq('user_id', dbUser.id)
    }

    const { data: bookings, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Get bookings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 