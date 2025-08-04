import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { booking_id, samples_count, remarks } = await request.json()

    if (!booking_id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    if (samples_count === undefined || samples_count === null) {
      return NextResponse.json({ error: 'Sample count is required' }, { status: 400 })
    }

    if (samples_count < 0) {
      return NextResponse.json({ error: 'Sample count cannot be negative' }, { status: 400 })
    }

    // Validate booking belongs to user
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        lab_slots (
          date,
          start_time,
          end_time
        )
      `)
      .eq('id', booking_id)
      .eq('user_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if session is completed
    const sessionDate = new Date(booking.lab_slots.date)
    const sessionEndTime = new Date(`${booking.lab_slots.date}T${booking.lab_slots.end_time}`)
    const now = new Date()

    if (now < sessionEndTime) {
      return NextResponse.json(
        { error: 'Cannot submit samples before session ends' }, 
        { status: 400 }
      )
    }

    // Check if samples already submitted
    if (booking.samples_count !== null) {
      return NextResponse.json(
        { error: 'Samples already submitted for this session' }, 
        { status: 400 }
      )
    }

    // Update booking with samples
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        samples_count,
        checkin_time: now.toISOString()
      })
      .eq('id', booking_id)

    if (updateError) {
      console.error('Sample submission error:', updateError)
      return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Samples submitted successfully!' 
    })
  } catch (error) {
    console.error('Sample submission API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 