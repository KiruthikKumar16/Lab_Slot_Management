'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Users, Plus, Edit, Trash2, AlertTriangle, ChevronLeft, ChevronRight, Eye, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LabSlot } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navigation from '@/components/Navigation'

interface SlotWithUser extends LabSlot {
  user?: {
    email: string
  }
}

export default function AdminLabSlots() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [slots, setSlots] = useState<SlotWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSlot, setSelectedSlot] = useState<SlotWithUser | null>(null)
  const [newSlot, setNewSlot] = useState({
    date: '',
    start_time: '',
    end_time: '',
    status: 'available',
    remarks: ''
  })

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!isAdmin) {
      router.push('/dashboard')
      return
    }

    fetchSlots()
  }, [user, isAdmin, router, selectedDate])

  const fetchSlots = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('lab_slots')
        .select(`
          *,
          user (*)
        `)
        .eq('date', selectedDate)
        .order('start_time', { ascending: true })

      if (error) throw error

      setSlots(data || [])
    } catch (error) {
      console.error('Error fetching slots:', error)
      toast.error('Failed to load lab slots')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSlot = async () => {
    try {
      const { error } = await supabase
        .from('lab_slots')
        .insert({
          ...newSlot,
          date: selectedDate
        })

      if (error) throw error

      toast.success('Lab slot created successfully')
      setShowAddForm(false)
      setNewSlot({ date: '', start_time: '', end_time: '', status: 'available', remarks: '' })
      fetchSlots()
    } catch (error) {
      console.error('Error creating slot:', error)
      toast.error('Failed to create lab slot')
    }
  }

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return

    try {
      const { error } = await supabase
        .from('lab_slots')
        .delete()
        .eq('id', slotId)

      if (error) throw error

      toast.success('Lab slot deleted successfully')
      fetchSlots()
    } catch (error) {
      console.error('Error deleting slot:', error)
      toast.error('Failed to delete lab slot')
    }
  }

  const handleCancelBooking = async (slotId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      const { error } = await supabase
        .from('lab_slots')
        .update({
          booked_by: null,
          status: 'available'
        })
        .eq('id', slotId)

      if (error) throw error

      toast.success('Booking cancelled successfully')
      fetchSlots()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error('Failed to cancel booking')
    }
  }

  const handleReopenSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('lab_slots')
        .update({
          status: 'available'
        })
        .eq('id', slotId)

      if (error) throw error

      toast.success('Slot reopened successfully')
      fetchSlots()
    } catch (error) {
      console.error('Error reopening slot:', error)
      toast.error('Failed to reopen slot')
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate)
    currentDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(currentDate.toISOString().split('T')[0])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600'
      case 'booked': return 'text-red-600'
      case 'closed': return 'text-gray-600'
      default: return 'text-blue-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return '🟢'
      case 'booked': return '🔴'
      case 'closed': return '⚫'
      default: return '🔵'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available'
      case 'booked': return 'Booked'
      case 'closed': return 'Closed'
      default: return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading lab slots...</p>
        </div>
      </div>
    )
  }

  const selectedDayName = days[new Date(selectedDate).getDay()]
  const selectedDayFormatted = new Date(selectedDate).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation currentPage="lab-slots" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Lab Slots Management
          </h1>
          <p className="text-slate-600 text-lg">Manage lab slots for each day</p>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-slate-800">
              {selectedDayFormatted}
            </h2>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Slot</span>
          </button>
        </div>

        {/* Add Slot Form */}
        {showAddForm && (
          <div className="glass-card p-6 mb-8">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Add New Lab Slot</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
                <input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={newSlot.status}
                  onChange={(e) => setNewSlot({ ...newSlot, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800"
                >
                  <option value="available">Available</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Remarks (Optional)</label>
              <input
                type="text"
                value={newSlot.remarks}
                onChange={(e) => setNewSlot({ ...newSlot, remarks: e.target.value })}
                placeholder="Any additional notes..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleAddSlot}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Slot
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Slots List */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Lab Slots for {selectedDayName}, {new Date(selectedDate).toLocaleDateString()}
          </h3>
          
          {slots.length > 0 ? (
            <div className="space-y-3">
              {slots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{getStatusIcon(slot.status)}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-slate-800">
                          {slot.start_time} – {slot.end_time}
                        </span>
                        <span className={`text-sm font-medium ${getStatusColor(slot.status)}`}>
                          {getStatusText(slot.status)}
                        </span>
                      </div>
                      {slot.status === 'booked' && slot.user && (
                        <div className="text-sm text-slate-600">
                          Booked by: {slot.user.email}
                        </div>
                      )}
                      {slot.remarks && (
                        <div className="text-sm text-slate-500">
                          {slot.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {slot.status === 'available' && (
                      <>
                        <button
                          onClick={() => setSelectedSlot(slot)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit slot"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    
                    {slot.status === 'booked' && (
                      <>
                        <button
                          onClick={() => setSelectedSlot(slot)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View booking details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancelBooking(slot.id)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Cancel booking"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    
                    {slot.status === 'closed' && (
                      <>
                        <button
                          onClick={() => handleReopenSlot(slot.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Reopen slot"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Lab Slots</h3>
              <p className="text-slate-600 mb-6">No lab slots have been created for this day.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300"
              >
                Create First Slot
              </button>
            </div>
          )}
        </div>

        {/* Slot Details Modal */}
        {selectedSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="glass-card p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Slot Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-slate-600">Date:</span>
                  <p className="text-slate-800">{new Date(selectedSlot.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">Time:</span>
                  <p className="text-slate-800">{selectedSlot.start_time} - {selectedSlot.end_time}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedSlot.status === 'booked' ? 'bg-red-100 text-red-800' :
                    selectedSlot.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {getStatusText(selectedSlot.status)}
                  </span>
                </div>
                {selectedSlot.status === 'booked' && selectedSlot.user && (
                  <div>
                    <span className="text-sm font-medium text-slate-600">Booked by:</span>
                    <p className="text-slate-800">{selectedSlot.user.email}</p>
                  </div>
                )}
                {selectedSlot.remarks && (
                  <div>
                    <span className="text-sm font-medium text-slate-600">Remarks:</span>
                    <p className="text-slate-800">{selectedSlot.remarks}</p>
                  </div>
                )}
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 glass-card p-4">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Legend</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🟢</span>
              <span className="text-sm text-slate-600">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl">🔴</span>
              <span className="text-sm text-slate-600">Booked</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl">⚫</span>
              <span className="text-sm text-slate-600">Closed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 