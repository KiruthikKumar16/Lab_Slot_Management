import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

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
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userInfo.email)
      .single()

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if today is Sunday
    const today = new Date()
    const isSunday = today.getDay() === 0
    if (!isSunday) {
      return NextResponse.json(
        { error: 'Bookings are only allowed on Sundays' }, 
        { status: 403 }
      )
    }

    const { lab_slot_id } = await request.json()

    if (!lab_slot_id) {
      return NextResponse.json({ error: 'Lab slot ID is required' }, { status: 400 })
    }

    // Check if slot exists and is available
    const { data: slot, error: slotError } = await supabase
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
    const { data: existingBooking } = await supabase
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
    const { data: sameDateBooking } = await supabase
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
    const { data: booking, error: bookingError } = await supabase
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
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', userInfo.email)
      .single()

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    let query = supabase
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