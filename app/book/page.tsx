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

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchBookingSettings()
    fetchSlots()
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

  const isBookingAllowed = () => {
    if (!bookingSettings) return false
    
    // Check if booking is open
    if (!bookingSettings.is_booking_open) return false
    
    // Check if current date is within booking period
    const today = new Date()
    const startDate = new Date(bookingSettings.booking_start_date)
    const endDate = new Date(bookingSettings.booking_end_date)
    
    if (today < startDate || today > endDate) return false
    
    // Check if current day is allowed
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const currentDay = dayNames[today.getDay()]
    
    return bookingSettings.allowed_days.includes(currentDay)
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

      // Book the slot
      const { error } = await supabase
        .from('lab_slots')
        .update({
          status: 'booked',
          booked_by: appUser.id
        })
        .eq('id', slotId)

      if (error) throw error

      toast.success('Slot booked successfully!')
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

  const isSlotAvailable = (slot: LabSlot) => {
    return slot.status === 'available' && !slot.booked_by
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
        {!isBookingAllowed() && (
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-800">Booking Closed</h3>
                <p className="text-orange-700">
                  {bookingSettings?.message || 'Booking is currently not available. Please check back later or contact the administrator.'}
                </p>
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
          {slots.length > 0 ? (
            slots.map((slot) => {
              const isAvailable = isSlotAvailable(slot)
              const isBooked = bookingLoading === slot.id

              return (
                <div key={slot.id} className="glass-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isAvailable ? 'Available' : 'Booked'}
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
                    disabled={!isAvailable || !isBookingAllowed() || isBooked}
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                      isAvailable && isBookingAllowed()
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isBooked ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Booking...</span>
                      </div>
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
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No Slots Available</h3>
                <p className="text-slate-600">No lab slots are currently available for the selected criteria.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 