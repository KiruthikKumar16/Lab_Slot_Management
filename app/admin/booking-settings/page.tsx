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
  }, [user, isAdmin, router])

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

   const handleQuickOpen = async (minutes: number) => {
     try {
       const now = new Date()
       const endTime = new Date(now.getTime() + minutes * 60 * 1000)
       
       const { error } = await supabase
         .from('booking_system_settings')
         .upsert({
           ...settings,
           is_emergency_booking_open: true,
           emergency_booking_start: now.toISOString(),
           emergency_booking_end: endTime.toISOString(),
           emergency_message: `Emergency booking open for ${minutes} minutes. Book now!`,
           updated_by: user?.id,
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
     } catch (error) {
       console.error('Error opening quick booking:', error)
       toast.error('Failed to open booking')
     }
   }

   const handleManualOpen = async () => {
     try {
       const now = new Date()
       
                const { error } = await supabase
           .from('booking_system_settings')
           .upsert({
             ...settings,
             is_emergency_booking_open: true,
             emergency_booking_start: now.toISOString(),
             emergency_booking_end: undefined, // No auto-close
             emergency_message: 'Manual booking is now open. Book your lab sessions!',
             updated_by: user?.id,
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
     } catch (error) {
       console.error('Error opening manual booking:', error)
       toast.error('Failed to open booking')
     }
   }

   const handleManualClose = async () => {
     try {
       const now = new Date()
       
                const { error } = await supabase
           .from('booking_system_settings')
           .upsert({
             ...settings,
             is_emergency_booking_open: false,
             emergency_booking_start: undefined,
             emergency_booking_end: undefined,
             emergency_message: 'Emergency booking is currently closed.',
             updated_by: user?.id,
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
     } catch (error) {
       console.error('Error closing booking:', error)
       toast.error('Failed to close booking')
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
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
                 <input
                   type="time"
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
                 <input
                   type="time"
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
                 />
               </div>
               <div>
                 <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300">
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
                   <tr className="hover:bg-slate-50">
                     <td className="px-4 py-3 text-sm text-slate-700">Sunday, Aug 10</td>
                     <td className="px-4 py-3 text-sm text-slate-700">09:00 – 11:00</td>
                     <td className="px-4 py-3">
                       <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                         Open
                       </span>
                     </td>
                     <td className="px-4 py-3">
                       <div className="flex items-center space-x-2">
                         <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                         <button className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                       </div>
                     </td>
                   </tr>
                   <tr className="hover:bg-slate-50">
                     <td className="px-4 py-3 text-sm text-slate-700">Monday, Aug 11</td>
                     <td className="px-4 py-3 text-sm text-slate-700">14:00 – 16:00</td>
                     <td className="px-4 py-3">
                       <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                         Limited
                       </span>
                     </td>
                     <td className="px-4 py-3">
                       <div className="flex items-center space-x-2">
                         <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                         <button className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                       </div>
                     </td>
                   </tr>
                   <tr className="hover:bg-slate-50">
                     <td className="px-4 py-3 text-sm text-slate-700">Wednesday, Aug 13</td>
                     <td className="px-4 py-3 text-sm text-slate-700">10:00 – 12:00</td>
                     <td className="px-4 py-3">
                       <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                         Closed
                       </span>
                     </td>
                     <td className="px-4 py-3">
                       <div className="flex items-center space-x-2">
                         <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                         <button className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                       </div>
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>
           </div>

                                               {/* Manual Booking Control */}
             <div className="mt-6 p-4 bg-slate-50 rounded-xl">
               <h4 className="font-semibold text-slate-800 mb-3">Manual Booking Control</h4>
               <p className="text-sm text-slate-600 mb-4">Quick on-the-spot control for immediate booking access</p>
               
               {/* Quick Time Slots */}
               <div className="mb-4">
                 <h5 className="font-medium text-slate-700 mb-3">Quick Time Slots</h5>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   <button 
                     onClick={() => handleQuickOpen(10)}
                     className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                   >
                     10 Minutes
                   </button>
                   <button 
                     onClick={() => handleQuickOpen(20)}
                     className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                   >
                     20 Minutes
                   </button>
                   <button 
                     onClick={() => handleQuickOpen(60)}
                     className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                   >
                     1 Hour
                   </button>
                   <button 
                     onClick={() => handleQuickOpen(120)}
                     className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                   >
                     2 Hours
                   </button>
                 </div>
               </div>

               {/* Manual Control */}
               <div className="flex flex-wrap gap-3">
                 <button 
                   onClick={handleManualOpen}
                   className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                 >
                   <CheckCircle className="w-4 h-4" />
                   <span>Open Booking Now</span>
                 </button>
                 <button 
                   onClick={handleManualClose}
                   className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
                 >
                   <XCircle className="w-4 h-4" />
                   <span>Close Booking Now</span>
                 </button>
               </div>

               {/* Current Manual Booking Status */}
               {settings.is_emergency_booking_open && (
                 <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                       <span className="text-sm font-medium text-green-800">Manual booking is currently OPEN</span>
                     </div>
                     <button 
                       onClick={handleManualClose}
                       className="text-sm text-red-600 hover:text-red-800 font-medium"
                     >
                       End Now
                     </button>
                   </div>
                   {settings.emergency_booking_end && (
                     <p className="text-xs text-green-600 mt-1">
                       Auto-closes at: {new Date(settings.emergency_booking_end).toLocaleTimeString()}
                     </p>
                   )}
                 </div>
               )}
             </div>
         </div>

       </div>
     </div>
   )
} 