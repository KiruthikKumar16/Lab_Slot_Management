'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Users, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LabSlot } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navigation from '@/components/Navigation'

export default function AdminLabSlots() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [slots, setSlots] = useState<LabSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSlot, setNewSlot] = useState({
    date: '',
    start_time: '',
    end_time: '',
    capacity: 1
  })

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation currentPage="lab-slots" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Manage Lab Slots
          </h1>
          <p className="text-slate-600 text-lg">Create and manage lab session slots</p>
        </div>

        {/* Add New Slot Button */}
        <div className="mb-6">
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

        {/* Slots List */}
        <div className="space-y-4">
          {slots.length > 0 ? (
            slots.map((slot) => (
              <div key={slot.id} className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="font-medium text-slate-800">
                          {new Date(slot.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-700">
                          {slot.start_time} - {slot.end_time}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-700">Capacity: {slot.capacity}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        slot.status === 'full' ? 'bg-red-100 text-red-800' :
                        slot.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {slot.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Lab Slots</h3>
              <p className="text-slate-600 mb-6">No lab slots have been created yet.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300"
              >
                Create First Slot
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 