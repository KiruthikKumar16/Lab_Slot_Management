'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Users, Search, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Booking, LabSlot, User as AppUser } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navigation from '@/components/Navigation'

interface BookingWithDetails extends Booking {
  lab_slot: LabSlot
  user: AppUser
}

export default function AdminBookings() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!isAdmin) {
      router.push('/dashboard')
      return
    }

    fetchBookings()
  }, [user, isAdmin, router])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          lab_slot (*),
          user (*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.lab_slot?.date?.includes(searchTerm) ||
                         booking.status?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || booking.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'no-show':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation currentPage="bookings" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            All Bookings
          </h1>
          <p className="text-slate-600 text-lg">View and manage all student bookings</p>
        </div>

        {/* Filters */}
        <div className="glass-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <Search className="w-5 h-5 text-slate-600" />
              <input
                type="text"
                placeholder="Search by email, date, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-slate-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="booked">Booked</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="font-medium text-slate-800">
                        {booking.user?.email || 'Unknown Student'}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{booking.lab_slot?.date}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{booking.lab_slot?.start_time} - {booking.lab_slot?.end_time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>Capacity: {booking.lab_slot?.capacity}</span>
                      </div>
                    </div>
                    {booking.samples_count && (
                      <div className="mt-2 text-sm text-green-600">
                        Samples submitted: {booking.samples_count}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-slate-500">
                      Booked on: {new Date(booking.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Bookings Found</h3>
              <p className="text-slate-600">
                {searchTerm || statusFilter ? 'No bookings match your filters.' : 'No bookings have been made yet.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 