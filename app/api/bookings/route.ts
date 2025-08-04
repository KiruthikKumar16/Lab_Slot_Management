import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      .eq('user_id', user.id)
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
        lab_slots!inner(date)
      `)
      .eq('user_id', user.id)
      .eq('status', 'booked')
      .eq('lab_slots.date', slot.date)
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
        user_id: user.id,
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
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    let query = supabase
      .from('bookings')
      .select(`
        *,
        lab_slots (*),
        users!inner(email, role)
      `)

    // If user_id is provided and user is admin, allow viewing other bookings
    if (user_id) {
      const { data: currentUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (currentUser?.role === 'admin') {
        query = query.eq('user_id', user_id)
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else {
      // Regular users can only see their own bookings
      query = query.eq('user_id', user.id)
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