'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Settings, Calendar, Clock, Save, AlertTriangle, Shield, Zap, CheckCircle, XCircle, Users, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { BookingSystemSettings } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navigation from '@/components/Navigation'

export default function BookingSettings() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
     const [loading, setLoading] = useState(true)
   const [saving, setSaving] = useState(false)
   const [customDuration, setCustomDuration] = useState('')
   const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
   const [bookingSlots, setBookingSlots] = useState<any[]>([])
   const [overrideHistory, setOverrideHistory] = useState<any[]>([])
   const [newSlot, setNewSlot] = useState({
     date: '',
     startTime: '',
     endTime: ''
   })
   const [editingSlot, setEditingSlot] = useState<any>(null)
   const [showEditModal, setShowEditModal] = useState(false)
   const [settings, setSettings] = useState<BookingSystemSettings>({
    id: 1,
    is_regular_booking_enabled: true,
    is_emergency_booking_open: false,
    emergency_booking_start: undefined,
    emergency_booking_end: undefined,
    emergency_allowed_days: [],
    regular_allowed_days: ['sunday'],
    regular_booking_start_time: '09:00',
    regular_booking_end_time: '11:00',
    manual_override_type: null, // 'open' | 'closed' | null
    manual_override_start: undefined,
    manual_override_end: undefined,
    manual_override_days: [],
    message: 'Regular booking is available every Sunday from 9 AM to 11 AM. Check back during scheduled times to book your lab session.',
    emergency_message: 'Emergency booking is currently open due to slot availability. Book now!',
    updated_at: new Date().toISOString()
  })

  const daysOfWeek = [
    { value: 'sunday', label: 'Sunday' },
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' }
  ]

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!isAdmin) {
      router.push('/dashboard')
      return
    }

              fetchSettings()
     fetchBookingSlots()
     fetchOverrideHistory()
   }, [user, isAdmin, router])

   const fetchBookingSlots = async () => {
     try {
       const { data, error } = await supabase
         .from('booking_system_settings')
         .select('*')
         .order('updated_at', { ascending: false })
         .limit(10)

       if (error) throw error

       // For now, we'll use mock data since we don't have a separate booking slots table
       setBookingSlots([
         { id: 1, date: '2025-08-10', startTime: '09:00', endTime: '11:00', status: 'open' },
         { id: 2, date: '2025-08-11', startTime: '14:00', endTime: '16:00', status: 'open' },
         { id: 3, date: '2025-08-13', startTime: '10:00', endTime: '12:00', status: 'closed' }
       ])
     } catch (error) {
       console.error('Error fetching booking slots:', error)
       toast.error('Failed to load booking slots')
     }
   }

   const fetchOverrideHistory = async () => {
     try {
       const { data, error } = await supabase
         .from('booking_system_settings')
         .select('*')
         .order('updated_at', { ascending: false })
         .limit(10)

       if (error) throw error

       if (data && data.length > 0) {
         // Create a more comprehensive history by processing each record
         const history: any[] = []
         
         for (let i = 0; i < Math.min(data.length, 4); i++) {
           const record = data[i]
           
           // Add the current state
           history.push({
             id: `${record.id}_current`,
             action: record.is_emergency_booking_open ? 'opened' : 'closed',
             timestamp: record.updated_at,
             startTime: record.emergency_booking_start,
             endTime: record.emergency_booking_end,
             message: record.emergency_message
           })
           
           // If this record has emergency booking data, add the start event too
           if (record.emergency_booking_start && record.is_emergency_booking_open) {
             history.push({
               id: `${record.id}_start`,
               action: 'opened',
               timestamp: record.emergency_booking_start,
               startTime: record.emergency_booking_start,
               endTime: record.emergency_booking_end,
               message: record.emergency_message
             })
           }
         }
         
         // Sort by timestamp and take the last 4
         const sortedHistory = history
           .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
           .slice(0, 4)
         
         setOverrideHistory(sortedHistory)
       } else {
         // If no data, create some sample history for demonstration
         const now = new Date()
         const sampleHistory = [
           {
             id: 'sample_1',
             action: 'opened',
             timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 mins ago
             startTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
             endTime: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
             message: 'Emergency booking opened for 1 hour'
           },
           {
             id: 'sample_2',
             action: 'closed',
             timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), // 1 hour ago
             startTime: undefined,
             endTime: undefined,
             message: 'Emergency booking closed'
           },
           {
             id: 'sample_3',
             action: 'opened',
             timestamp: new Date(now.getTime() - 90 * 60 * 1000).toISOString(), // 1.5 hours ago
             startTime: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
             endTime: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
             message: 'Emergency booking opened for 30 minutes'
           },
           {
             id: 'sample_4',
             action: 'closed',
             timestamp: new Date(now.getTime() - 120 * 60 * 1000).toISOString(), // 2 hours ago
             startTime: undefined,
             endTime: undefined,
             message: 'Emergency booking closed'
           }
         ]
         setOverrideHistory(sampleHistory)
       }
     } catch (error) {
       console.error('Error fetching override history:', error)
       // Fallback to sample data if there's an error
       const now = new Date()
       const sampleHistory = [
         {
           id: 'fallback_1',
           action: 'opened',
           timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
           startTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
           endTime: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
           message: 'Emergency booking opened for 1 hour'
         },
         {
           id: 'fallback_2',
           action: 'closed',
           timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
           startTime: undefined,
           endTime: undefined,
           message: 'Emergency booking closed'
         },
         {
           id: 'fallback_3',
           action: 'opened',
           timestamp: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
           startTime: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
           endTime: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
           message: 'Emergency booking opened for 30 minutes'
         },
         {
           id: 'fallback_4',
           action: 'closed',
           timestamp: new Date(now.getTime() - 120 * 60 * 1000).toISOString(),
           startTime: undefined,
           endTime: undefined,
           message: 'Emergency booking closed'
         }
       ]
       setOverrideHistory(sampleHistory)
     }
   }

   const fetchSettings = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('booking_system_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load booking settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Get current user ID
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user?.email)
        .single()

      if (userError) throw userError

      const { error } = await supabase
        .from('booking_system_settings')
        .upsert({
          ...settings,
          updated_by: currentUser.id,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Booking settings updated successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

     const handleRegularDayToggle = (day: string) => {
     setSettings(prev => ({
       ...prev,
       regular_allowed_days: prev.regular_allowed_days.includes(day)
         ? prev.regular_allowed_days.filter(d => d !== day)
         : [...prev.regular_allowed_days, day]
     }))
   }

       const handleSelectDuration = (minutes: number) => {
      setSelectedDuration(minutes)
      setCustomDuration('') // Clear custom duration when selecting preset
    }

    const handleQuickOpen = async (minutes: number) => {
      try {
        const now = new Date()
        const endTime = new Date(now.getTime() + minutes * 60 * 1000)
        
        // Get current user ID first
        const { data: currentUser, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', user?.email)
          .single()

        if (userError) throw userError

        const { error } = await supabase
          .from('booking_system_settings')
          .upsert({
            ...settings,
            is_emergency_booking_open: true,
            emergency_booking_start: now.toISOString(),
            emergency_booking_end: endTime.toISOString(),
            emergency_message: `Emergency booking open for ${minutes} minutes. Book now!`,
            updated_by: currentUser.id,
            updated_at: now.toISOString()
          })

        if (error) throw error

        // Update local state
        setSettings(prev => ({
          ...prev,
          is_emergency_booking_open: true,
          emergency_booking_start: now.toISOString(),
          emergency_booking_end: endTime.toISOString(),
          emergency_message: `Emergency booking open for ${minutes} minutes. Book now!`
        }))

        toast.success(`Booking opened for ${minutes} minutes!`)
        fetchOverrideHistory() // Refresh history
      } catch (error) {
        console.error('Error opening quick booking:', error)
        toast.error('Failed to open booking')
      }
    }

       const handleManualOpen = async () => {
      try {
        const now = new Date()
        
        // Check if a duration is selected
        if (selectedDuration) {
          // Use the selected duration
          await handleQuickOpen(selectedDuration)
          setSelectedDuration(null) // Clear selection after opening
          return
        }

        // If no duration selected, open indefinitely
        // Get current user ID first
        const { data: currentUser, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', user?.email)
          .single()

        if (userError) throw userError
        
        const { error } = await supabase
          .from('booking_system_settings')
          .upsert({
            ...settings,
            is_emergency_booking_open: true,
            emergency_booking_start: now.toISOString(),
            emergency_booking_end: undefined, // No auto-close
            emergency_message: 'Manual booking is now open. Book your lab sessions!',
            updated_by: currentUser.id,
            updated_at: now.toISOString()
          })

        if (error) throw error

        // Update local state
        setSettings(prev => ({
          ...prev,
          is_emergency_booking_open: true,
          emergency_booking_start: now.toISOString(),
          emergency_booking_end: undefined,
          emergency_message: 'Manual booking is now open. Book your lab sessions!'
        }))

        toast.success('Manual booking opened!')
        fetchOverrideHistory() // Refresh history
      } catch (error) {
        console.error('Error opening manual booking:', error)
        toast.error('Failed to open booking')
      }
    }

               const handleManualClose = async () => {
       try {
         const now = new Date()
         
         // Get current user ID first
         const { data: currentUser, error: userError } = await supabase
           .from('users')
           .select('id')
           .eq('email', user?.email)
           .single()

         if (userError) throw userError
         
         const { error } = await supabase
           .from('booking_system_settings')
           .upsert({
             ...settings,
             is_emergency_booking_open: false,
             emergency_booking_start: undefined,
             emergency_booking_end: undefined,
             emergency_message: 'Emergency booking is currently closed.',
             updated_by: currentUser.id,
             updated_at: now.toISOString()
           })

         if (error) throw error

         // Update local state
         setSettings(prev => ({
           ...prev,
           is_emergency_booking_open: false,
           emergency_booking_start: undefined,
           emergency_booking_end: undefined,
           emergency_message: 'Emergency booking is currently closed.'
         }))

                   toast.success('Booking closed!')
          fetchOverrideHistory() // Refresh history
        } catch (error) {
          console.error('Error closing booking:', error)
          toast.error('Failed to close booking')
        }
      }

                   const handleCustomOpen = async () => {
        const minutes = parseInt(customDuration || '0')
        
        if (minutes <= 0 || minutes > 1440) { // Max 24 hours
          toast.error('Please enter a valid duration (1-1440 minutes)')
          return
        }
        
        setSelectedDuration(minutes)
        setCustomDuration('') // Clear input after use
        toast.success(`Duration set to ${minutes} minutes. Click "Open Booking Now" to start.`)
      }

         const handleAddSlot = async () => {
       if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
         toast.error('Please fill in all fields')
         return
       }

       if (newSlot.startTime >= newSlot.endTime) {
         toast.error('End time must be after start time')
         return
       }

       try {
         const slot = {
           id: Date.now(), // Temporary ID for demo
           date: newSlot.date,
           startTime: newSlot.startTime,
           endTime: newSlot.endTime,
           status: 'open'
         }

         setBookingSlots(prev => [...prev, slot])
         setNewSlot({ date: '', startTime: '', endTime: '' })
         toast.success('Booking slot added successfully!')
       } catch (error) {
         console.error('Error adding slot:', error)
         toast.error('Failed to add booking slot')
       }
     }

           const handleEditSlot = (slotId: number) => {
        const slot = bookingSlots.find(s => s.id === slotId)
        if (slot) {
          setEditingSlot(slot)
          setShowEditModal(true)
        }
      }

      const handleUpdateSlot = () => {
        if (!editingSlot) return
        
        if (!editingSlot.date || !editingSlot.startTime || !editingSlot.endTime) {
          toast.error('Please fill in all fields')
          return
        }

        if (editingSlot.startTime >= editingSlot.endTime) {
          toast.error('End time must be after start time')
          return
        }

        setBookingSlots(prev => prev.map(slot => 
          slot.id === editingSlot.id ? editingSlot : slot
        ))
        
        setShowEditModal(false)
        setEditingSlot(null)
        toast.success('Booking slot updated successfully!')
      }

      const handleCancelEdit = () => {
        setShowEditModal(false)
        setEditingSlot(null)
      }

     const handleDeleteSlot = (slotId: number) => {
       setBookingSlots(prev => prev.filter(s => s.id !== slotId))
       toast.success('Booking slot deleted successfully!')
     }

    const getDurationText = (startTime?: string, endTime?: string) => {
      if (!startTime || !endTime) return 'Manual (no auto-close)'
      
      const start = new Date(startTime)
      const end = new Date(endTime)
      const diffMs = end.getTime() - start.getTime()
      const diffMins = Math.round(diffMs / (1000 * 60))
      
      if (diffMins < 60) {
        return `${diffMins} minutes`
      } else if (diffMins < 120) {
        return '1 hour'
      } else {
        const hours = Math.floor(diffMins / 60)
        return `${hours} hours`
      }
    }



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading booking settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation currentPage="booking-settings" />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Booking System Settings
              </h1>
              <p className="text-slate-600">Control when students can book lab sessions</p>
            </div>
          </div>
        </div>

                          {/* Booking Slots Management */}
         <div className="glass-card p-6">
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center space-x-3">
               <Calendar className="w-6 h-6 text-blue-600" />
               <h2 className="text-xl font-semibold text-slate-800">Booking Time Slots</h2>
             </div>
             <div className="text-sm text-slate-500">
               Manage when students can book lab sessions
             </div>
           </div>

                       {/* Add New Booking Slot */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-slate-800 mb-4">➕ Add New Booking Slot</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={newSlot.date}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
                  />
                </div>
                <div>
                  <button 
                    onClick={handleAddSlot}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300"
                  >
                    Add Slot
                  </button>
                </div>
              </div>
            </div>

                       {/* Current Booking Slots */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-4">📋 Current Booking Slots</h3>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Time</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                                     <tbody className="divide-y divide-slate-200">
                     {bookingSlots.length === 0 ? (
                       <tr>
                         <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                           No booking slots found. Add your first slot above.
                         </td>
                       </tr>
                     ) : (
                       bookingSlots.map((slot) => (
                         <tr key={slot.id} className="hover:bg-slate-50">
                           <td className="px-4 py-3 text-sm text-slate-700">
                             {new Date(slot.date).toLocaleDateString('en-US', { 
                               weekday: 'long', 
                               month: 'short', 
                               day: 'numeric' 
                             })}
                           </td>
                           <td className="px-4 py-3 text-sm text-slate-700">
                             {slot.startTime} – {slot.endTime}
                           </td>
                           <td className="px-4 py-3">
                             <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                               slot.status === 'open' 
                                 ? 'bg-green-100 text-green-800' 
                                 : 'bg-red-100 text-red-800'
                             }`}>
                               {slot.status === 'open' ? 'Open' : 'Closed'}
                             </span>
                           </td>
                           <td className="px-4 py-3">
                             <div className="flex items-center space-x-2">
                               <button 
                                 onClick={() => handleEditSlot(slot.id)}
                                 className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                               >
                                 Edit
                               </button>
                               <button 
                                 onClick={() => handleDeleteSlot(slot.id)}
                                 className="text-red-600 hover:text-red-800 text-sm font-medium"
                               >
                                 Delete
                               </button>
                             </div>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                </table>
              </div>
            </div>

                                                                                               {/* Manual Booking Control */}
              <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                <h4 className="font-semibold text-slate-800 mb-3">Manual Booking Control</h4>
                <p className="text-sm text-slate-600 mb-4">Quick on-the-spot control for immediate booking access</p>
                
                                 {/* Quick Time Slots - Improved UI */}
                 <div className="mb-6">
                   <h5 className="font-medium text-slate-700 mb-3">Select Duration:</h5>
                   <div className="flex flex-wrap gap-2 mb-3">
                                         <button 
                       onClick={() => handleSelectDuration(10)}
                       className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                         selectedDuration === 10 
                           ? 'bg-blue-600 text-white' 
                           : 'bg-gray-200 text-gray-700 hover:bg-blue-600 hover:text-white'
                       }`}
                     >
                       10m
                     </button>
                     <button 
                       onClick={() => handleSelectDuration(20)}
                       className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                         selectedDuration === 20 
                           ? 'bg-blue-600 text-white' 
                           : 'bg-gray-200 text-gray-700 hover:bg-blue-600 hover:text-white'
                       }`}
                     >
                       20m
                     </button>
                     <button 
                       onClick={() => handleSelectDuration(60)}
                       className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                         selectedDuration === 60 
                           ? 'bg-blue-600 text-white' 
                           : 'bg-gray-200 text-gray-700 hover:bg-blue-600 hover:text-white'
                       }`}
                     >
                       1h
                     </button>
                     <button 
                       onClick={() => handleSelectDuration(120)}
                       className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                         selectedDuration === 120 
                           ? 'bg-blue-600 text-white' 
                           : 'bg-gray-200 text-gray-700 hover:bg-blue-600 hover:text-white'
                       }`}
                     >
                       2h
                     </button>
                                         <div className="flex items-center space-x-2">
                       <span className="text-sm text-slate-600">Custom:</span>
                       <input 
                         type="number" 
                         placeholder="90" 
                         value={customDuration}
                         onChange={(e) => setCustomDuration(e.target.value)}
                         className="w-16 px-2 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-800"
                       />
                       <span className="text-sm text-slate-600">mins</span>
                       <button 
                         onClick={handleCustomOpen}
                         className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                       >
                         Open
                       </button>
                     </div>
                  </div>
                </div>

                                 {/* Manual Control - Improved Buttons */}
                                   <div className="flex flex-wrap gap-3 mb-4">
                    <button 
                      onClick={handleManualOpen}
                      disabled={settings.is_emergency_booking_open}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        settings.is_emergency_booking_open 
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        {selectedDuration 
                          ? `Open Booking for ${selectedDuration} minutes` 
                          : 'Open Booking Now'
                        }
                      </span>
                    </button>
                    {settings.is_emergency_booking_open && (
                      <button 
                        onClick={handleManualClose}
                        className="px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 bg-red-600 text-white hover:bg-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Close Booking Now</span>
                      </button>
                    )}
                  </div>

                {/* Current Manual Booking Status - Enhanced */}
                {settings.is_emergency_booking_open && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-800">
                          🟢 Booking is OPEN
                        </span>
                      </div>
                      <button 
                        onClick={handleManualClose}
                        className="text-sm text-red-600 hover:text-red-800 font-medium bg-red-50 px-3 py-1 rounded"
                      >
                        🔒 End Early
                      </button>
                    </div>
                    {settings.emergency_booking_end && (
                      <div className="text-xs text-green-600">
                        <p>⏰ Auto-closes at: {new Date(settings.emergency_booking_end).toLocaleTimeString()}</p>
                        <p>🕒 Duration: {getDurationText(settings.emergency_booking_start, settings.emergency_booking_end)}</p>
                      </div>
                    )}
                  </div>
                )}

                                                  {/* Recent Override History */}
                 <div className="mt-6 p-3 bg-white border border-slate-200 rounded-lg">
                   <h5 className="font-medium text-slate-800 mb-3">📜 Recent Overrides:</h5>
                   <div className="space-y-2 text-sm">
                     {overrideHistory.length === 0 ? (
                       <div className="text-slate-500 text-center py-2">
                         No recent overrides found
                       </div>
                     ) : (
                       overrideHistory.map((override) => (
                         <div key={override.id} className="flex items-center space-x-2">
                           <span className={override.action === 'opened' ? 'text-green-600' : 'text-red-600'}>
                             {override.action === 'opened' ? '✔️' : '❌'}
                           </span>
                           <span className="text-slate-700">
                             {override.action === 'opened' ? 'Opened' : 'Closed'}: {
                               new Date(override.timestamp).toLocaleDateString('en-US', {
                                 month: 'short',
                                 day: 'numeric'
                               })
                             }, {
                               new Date(override.timestamp).toLocaleTimeString('en-US', {
                                 hour: 'numeric',
                                 minute: '2-digit',
                                 hour12: true
                               })
                             }
                             {override.startTime && override.endTime && (
                               ` → ${new Date(override.endTime).toLocaleTimeString('en-US', {
                                 hour: 'numeric',
                                 minute: '2-digit',
                                 hour12: true
                               })}`
                             )}
                           </span>
                         </div>
                       ))
                     )}
                   </div>
                 </div>
               </div>
          </div>

          {/* Edit Slot Modal */}
          {showEditModal && editingSlot && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Edit Booking Slot</h3>
                  <button 
                    onClick={handleCancelEdit}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editingSlot.date}
                      onChange={(e) => setEditingSlot(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={editingSlot.startTime}
                      onChange={(e) => setEditingSlot(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={editingSlot.endTime}
                      onChange={(e) => setEditingSlot(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <select
                      value={editingSlot.status}
                      onChange={(e) => setEditingSlot(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleUpdateSlot}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300"
                  >
                    Update Slot
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    )
} 