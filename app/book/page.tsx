'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Users, MapPin, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LabSlot, BookingSystemSettings } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navigation from '@/components/Navigation'

export default function BookPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [slots, setSlots] = useState<LabSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('')
  const [bookingLoading, setBookingLoading] = useState<string | null>(null)
  const [bookingSettings, setBookingSettings] = useState<BookingSystemSettings | null>(null)
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchBookingSettings()
    fetchSlots()
    fetchUserBookings()
  }, [user, router])

  const fetchBookingSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_system_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching booking settings:', error)
        return
      }

      setBookingSettings(data)
    } catch (error) {
      console.error('Error fetching booking settings:', error)
    }
  }

  const fetchSlots = async () => {
    try {
      setLoading(true)
      
      // Get next 7 days of slots
      const today = new Date()
      const nextWeek: string[] = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        nextWeek.push(date.toISOString().split('T')[0])
      }

      const { data, error } = await supabase
        .from('lab_slots')
        .select('*')
        .in('date', nextWeek)
        .eq('status', 'available')
        .is('booked_by', null)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error

      setSlots(data || [])
    } catch (error) {
      console.error('Error fetching slots:', error)
      toast.error('Failed to load available slots')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserBookings = async () => {
    try {
      // Get current user ID
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user?.email)
        .single()

      if (userError) throw userError

      // Fetch slots booked by this user
      const { data, error } = await supabase
        .from('lab_slots')
        .select('id')
        .eq('booked_by', currentUser.id)
        .eq('status', 'booked')

      if (error) throw error

      // Create a set of booked slot IDs
      const bookedSlotIds = new Set(data?.map(slot => slot.id) || [])
      setBookedSlots(bookedSlotIds)
    } catch (error) {
      console.error('Error fetching user bookings:', error)
    }
  }

  const isBookingAllowed = () => {
    if (!bookingSettings) return false
    
    const now = new Date()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const currentDay = dayNames[now.getDay()]
    
    // Check emergency booking first (takes priority)
    if (bookingSettings.is_emergency_booking_open) {
      const emergencyStart = bookingSettings.emergency_booking_start ? new Date(bookingSettings.emergency_booking_start) : null
      const emergencyEnd = bookingSettings.emergency_booking_end ? new Date(bookingSettings.emergency_booking_end) : null
      
      // Check if we're within emergency booking time window
      if (emergencyStart && emergencyEnd) {
        if (now >= emergencyStart && now <= emergencyEnd) {
          // Check if current day is allowed for emergency booking
          if (bookingSettings.emergency_allowed_days?.includes(currentDay)) {
            return true
          }
        }
      }
    }
    
    // Check regular booking (Sunday schedule)
    if (bookingSettings.is_regular_booking_enabled) {
      return bookingSettings.regular_allowed_days.includes(currentDay)
    }
    
    return false
  }

  const getBookingMessage = () => {
    if (!bookingSettings) return 'Booking system is not configured.'
    
    const now = new Date()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const currentDay = dayNames[now.getDay()]
    
    // Check if emergency booking is active
    if (bookingSettings.is_emergency_booking_open) {
      const emergencyStart = bookingSettings.emergency_booking_start ? new Date(bookingSettings.emergency_booking_start) : null
      const emergencyEnd = bookingSettings.emergency_booking_end ? new Date(bookingSettings.emergency_booking_end) : null
      
      if (emergencyStart && emergencyEnd && now >= emergencyStart && now <= emergencyEnd) {
        if (bookingSettings.emergency_allowed_days?.includes(currentDay)) {
          return bookingSettings.emergency_message
        }
      }
    }
    
    return bookingSettings.message
  }

  const handleBookSlot = async (slotId: string) => {
    if (!user) return

    if (!isBookingAllowed()) {
      toast.error('Booking is not currently allowed')
      return
    }

    try {
      setBookingLoading(slotId)

      // First check if slot is still available
      const { data: slotCheck, error: checkError } = await supabase
        .from('lab_slots')
        .select('status, booked_by')
        .eq('id', slotId)
        .single()

      if (checkError) throw checkError

      if (slotCheck.status !== 'available' || slotCheck.booked_by) {
        toast.error('This slot is no longer available')
        fetchSlots()
        return
      }

      // Get the current user's app user ID
      const { data: appUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (userError || !appUser) {
        toast.error('User not found. Please contact administrator.')
        return
      }

      // Get the slot details for booking creation
      const { data: slotDetails, error: slotError } = await supabase
        .from('lab_slots')
        .select('*')
        .eq('id', slotId)
        .single()

      if (slotError) throw slotError

      // Book the slot
      const { error } = await supabase
        .from('lab_slots')
        .update({
          status: 'booked',
          booked_by: appUser.id
        })
        .eq('id', slotId)

      if (error) throw error

      // Create booking record
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: appUser.id,
          lab_slot_id: slotId,
          status: 'booked',
          samples_count: 0
        })

      if (bookingError) {
        console.error('Error creating booking record:', bookingError)
        // Don't fail the entire booking if booking record creation fails
        // The slot is already booked, so we'll just log the error
      }

      toast.success('Slot booked successfully!')
      // Add to booked slots set
      setBookedSlots(prev => new Set(Array.from(prev).concat(slotId)))
      fetchSlots()
    } catch (error) {
      console.error('Error booking slot:', error)
      toast.error('Failed to book slot')
    } finally {
      setBookingLoading(null)
    }
  }

  const getAvailableDates = () => {
    const dates: string[] = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  const getSlotsForDate = (date: string) => {
    return slots.filter(slot => slot.date === date)
  }

  const isSlotExpired = (slot: LabSlot) => {
    const now = new Date()
    const slotDate = new Date(slot.date)
    const slotStartTime = new Date(`${slot.date}T${slot.start_time}`)
    
    // Check if slot date is in the past
    if (slotDate < now && slotDate.toDateString() !== now.toDateString()) {
      return true
    }
    
    // Check if slot time has passed today
    if (slotDate.toDateString() === now.toDateString() && slotStartTime < now) {
      return true
    }
    
    return false
  }

  const isSlotAvailable = (slot: LabSlot) => {
    // Check if slot is expired
    if (isSlotExpired(slot)) {
      return false
    }
    
    // Check if slot is already booked by current user
    if (bookedSlots.has(slot.id)) {
      return false
    }
    
    // Check if slot is available and not booked by anyone
    return slot.status === 'available' && !slot.booked_by
  }

  const isSlotBookedByUser = (slot: LabSlot) => {
    return bookedSlots.has(slot.id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading available slots...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation currentPage="book" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Book Lab Session
          </h1>
          <p className="text-slate-600 text-lg">Select an available time slot for your lab session</p>
        </div>

        {/* Booking Status Warning */}
        {!isBookingAllowed() && bookingSettings && (
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-800">Booking Closed</h3>
                <p className="text-orange-700">{getBookingMessage()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Booking Banner */}
        {isBookingAllowed() && bookingSettings?.is_emergency_booking_open && (
          <div className="glass-card p-6 mb-8 border border-green-300 bg-green-50/50">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Emergency Booking Open</h3>
                <p className="text-green-700">{bookingSettings.emergency_message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Date Filter */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center space-x-4">
            <Calendar className="w-5 h-5 text-slate-600" />
            <label className="font-semibold text-slate-800">Select Date:</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            >
              <option value="">All Available Dates</option>
              {getAvailableDates().map(date => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Available Slots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(selectedDate ? getSlotsForDate(selectedDate) : slots).length > 0 ? (
            (selectedDate ? getSlotsForDate(selectedDate) : slots).map((slot) => {
              const isAvailable = isSlotAvailable(slot)
              const isBooked = bookingLoading === slot.id
              const isExpired = isSlotExpired(slot)
              const isBookedByUser = isSlotBookedByUser(slot)

              return (
                <div key={slot.id} className="glass-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isExpired 
                        ? 'bg-gray-100 text-gray-600' 
                        : isBookedByUser 
                          ? 'bg-blue-100 text-blue-800'
                          : isAvailable 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }`}>
                      {isExpired 
                        ? 'Expired' 
                        : isBookedByUser 
                          ? 'Booked'
                          : isAvailable 
                            ? 'Available' 
                            : 'Booked'}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-700 font-medium">
                        {slot.start_time} - {slot.end_time}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-700 font-medium">Lab Room</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-700">
                        {new Date(slot.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    {slot.remarks && (
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600 text-sm">{slot.remarks}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleBookSlot(slot.id)}
                    disabled={!isAvailable || !isBookingAllowed() || isBooked || isExpired}
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                      isExpired
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : isBookedByUser
                          ? 'bg-blue-600 text-white cursor-not-allowed'
                          : isAvailable && isBookingAllowed()
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isBooked ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Booking...</span>
                      </div>
                    ) : isExpired ? (
                      'Expired'
                    ) : isBookedByUser ? (
                      'Booked'
                    ) : (
                      'Book This Slot'
                    )}
                  </button>
                </div>
              )
            })
          ) : (
            <div className="col-span-full">
              <div className="glass-card p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  {selectedDate ? 'No Slots Available for Selected Date' : 'No Slots Available'}
                </h3>
                <p className="text-slate-600">
                  {selectedDate 
                    ? `No lab slots are available for ${new Date(selectedDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}. Try selecting a different date or check back later.`
                    : 'No lab slots are currently available for the selected criteria.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 