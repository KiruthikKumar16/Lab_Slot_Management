'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Users, Plus, Edit, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LabSlot } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navigation from '@/components/Navigation'

interface TimeSlot {
  time: string
  display: string
}

interface GridSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  capacity: number
  status: string
  left: number
  width: number
  color: string
}

export default function AdminLabSlots() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [slots, setSlots] = useState<LabSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState<GridSlot | null>(null)
  const [newSlot, setNewSlot] = useState({
    date: '',
    start_time: '',
    end_time: '',
    capacity: 1
  })

  // Time slots from 8:00 AM to 7:00 PM in 30-minute intervals
  const timeSlots: TimeSlot[] = [
    { time: '08:00', display: '8:00' },
    { time: '08:30', display: '8:30' },
    { time: '09:00', display: '9:00' },
    { time: '09:30', display: '9:30' },
    { time: '10:00', display: '10:00' },
    { time: '10:30', display: '10:30' },
    { time: '11:00', display: '11:00' },
    { time: '11:30', display: '11:30' },
    { time: '12:00', display: '12:00' },
    { time: '12:30', display: '12:30' },
    { time: '13:00', display: '1:00' },
    { time: '13:30', display: '1:30' },
    { time: '14:00', display: '2:00' },
    { time: '14:30', display: '2:30' },
    { time: '15:00', display: '3:00' },
    { time: '15:30', display: '3:30' },
    { time: '16:00', display: '4:00' },
    { time: '16:30', display: '4:30' },
    { time: '17:00', display: '5:00' },
    { time: '17:30', display: '5:30' },
    { time: '18:00', display: '6:00' },
    { time: '18:30', display: '6:30' },
    { time: '19:00', display: '7:00' }
  ]

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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
  }, [user, isAdmin, router])

  const fetchSlots = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('lab_slots')
        .select('*')
        .order('date', { ascending: true })
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
        .insert(newSlot)

      if (error) throw error

      toast.success('Lab slot created successfully')
      setShowAddForm(false)
      setNewSlot({ date: '', start_time: '', end_time: '', capacity: 1 })
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

  const getWeekDates = () => {
    const dates: string[] = []
    const startOfWeek = new Date(currentWeek)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1) // Monday

    for (let i = 0; i < 6; i++) {
      const date = new Date(startOfWeek)
      date.setDate(date.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  const calculateSlotPosition = (slot: LabSlot) => {
    const startIndex = timeSlots.findIndex(t => t.time === slot.start_time)
    const endIndex = timeSlots.findIndex(t => t.time === slot.end_time)
    
    if (startIndex === -1 || endIndex === -1) return null

    const left = (startIndex / timeSlots.length) * 100
    const width = ((endIndex - startIndex + 1) / timeSlots.length) * 100

    return { left, width }
  }

  const getSlotColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'full': return 'bg-red-500'
      case 'closed': return 'bg-gray-500'
      default: return 'bg-blue-500'
    }
  }

  const getGridSlots = () => {
    const weekDates = getWeekDates()
    const gridSlots: GridSlot[] = []

    slots.forEach(slot => {
      const slotDate = new Date(slot.date).toISOString().split('T')[0]
      const dayIndex = weekDates.indexOf(slotDate)
      
      if (dayIndex !== -1) {
        const position = calculateSlotPosition(slot)
        if (position) {
          gridSlots.push({
            ...slot,
            left: position.left,
            width: position.width,
            color: getSlotColor(slot.status)
          })
        }
      }
    })

    return gridSlots
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newWeek)
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

  const weekDates = getWeekDates()
  const gridSlots = getGridSlots()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation currentPage="lab-slots" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Lab Schedule Grid
          </h1>
          <p className="text-slate-600 text-lg">Visual lab slot management with flexible durations</p>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-slate-800">
              {currentWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => navigateWeek('next')}
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
            <span>Add New Slot</span>
          </button>
        </div>

        {/* Add Slot Form */}
        {showAddForm && (
          <div className="glass-card p-6 mb-8">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Add New Lab Slot</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newSlot.date}
                  onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={newSlot.capacity}
                  onChange={(e) => setNewSlot({ ...newSlot, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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

        {/* Schedule Grid */}
        <div className="glass-card p-6">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* Time Header */}
              <div className="flex border-b border-slate-200">
                <div className="w-24 h-12 flex items-center justify-center bg-slate-50 border-r border-slate-200">
                  <span className="text-sm font-medium text-slate-600">Time</span>
                </div>
                {timeSlots.map((timeSlot, index) => (
                  <div
                    key={index}
                    className="flex-1 h-12 flex items-center justify-center border-r border-slate-200 bg-slate-50"
                  >
                    <span className="text-xs text-slate-600">{timeSlot.display}</span>
                  </div>
                ))}
              </div>

              {/* Days and Slots */}
              {days.map((day, dayIndex) => {
                const dayDate = weekDates[dayIndex]
                const daySlots = gridSlots.filter(slot => slot.date === dayDate)
                
                return (
                  <div key={day} className="flex border-b border-slate-200 relative">
                    {/* Day Label */}
                    <div className="w-24 h-20 flex items-center justify-center bg-slate-50 border-r border-slate-200">
                      <div className="text-center">
                        <div className="text-sm font-medium text-slate-800">{day}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(dayDate).getDate()}
                        </div>
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div className="flex-1 relative h-20">
                      {timeSlots.map((_, index) => (
                        <div
                          key={index}
                          className="absolute top-0 bottom-0 border-r border-slate-200"
                          style={{ left: `${(index / timeSlots.length) * 100}%` }}
                        />
                      ))}

                      {/* Lab Slots */}
                      {daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`absolute top-1 bottom-1 rounded-lg text-white text-xs font-medium flex items-center justify-center cursor-pointer transition-all hover:scale-105 ${slot.color}`}
                          style={{
                            left: `${slot.left}%`,
                            width: `${slot.width}%`,
                            minWidth: '60px'
                          }}
                          onClick={() => setSelectedSlot(slot)}
                          title={`${slot.start_time} - ${slot.end_time} (Capacity: ${slot.capacity})`}
                        >
                          <div className="text-center px-1">
                            <div className="font-bold">{slot.start_time.slice(0, 5)}</div>
                            <div className="text-xs opacity-90">{slot.capacity} students</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
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
                  <span className="text-sm font-medium text-slate-600">Capacity:</span>
                  <p className="text-slate-800">{selectedSlot.capacity} students</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedSlot.status === 'full' ? 'bg-red-100 text-red-800' :
                    selectedSlot.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedSlot.status}
                  </span>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => handleDeleteSlot(selectedSlot.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Slot
                </button>
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
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-slate-600">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-slate-600">Full</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-sm text-slate-600">Closed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 