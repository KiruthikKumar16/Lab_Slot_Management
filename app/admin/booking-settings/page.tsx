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

                 {/* Compact Status Overview */}
         <div className="glass-card p-4 mb-6">
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-6">
               <div className="flex items-center space-x-2">
                 <div className={`w-3 h-3 rounded-full ${settings.is_regular_booking_enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                 <span className="text-sm font-medium text-slate-700">Scheduled: {settings.is_regular_booking_enabled ? 'ON' : 'OFF'}</span>
               </div>
               <div className="flex items-center space-x-2">
                 <div className={`w-3 h-3 rounded-full ${settings.is_emergency_booking_open ? 'bg-orange-500' : 'bg-gray-400'}`}></div>
                 <span className="text-sm font-medium text-slate-700">Manual: {settings.is_emergency_booking_open ? 'ACTIVE' : 'INACTIVE'}</span>
               </div>
             </div>
             <div className="text-sm text-slate-500">
               {settings.regular_allowed_days.length} scheduled days • {settings.emergency_allowed_days?.length || 0} overrides
             </div>
           </div>
         </div>

                                   {/* Compact Booking Settings Form */}
         <div className="glass-card p-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Scheduled Booking */}
             <div>
               <div className="flex items-center space-x-2 mb-4">
                 <Calendar className="w-5 h-5 text-blue-600" />
                 <h3 className="text-lg font-semibold text-slate-800">Scheduled Booking</h3>
               </div>
               
               {/* Enable Toggle */}
               <div className="flex items-center space-x-3 mb-4">
                 <input
                   type="checkbox"
                   checked={settings.is_regular_booking_enabled}
                   onChange={(e) => setSettings(prev => ({ ...prev, is_regular_booking_enabled: e.target.checked }))}
                   className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500"
                 />
                 <span className="text-sm font-medium text-slate-700">Enable recurring weekly booking</span>
               </div>

               {/* Time Range */}
               <div className="flex items-center space-x-3 mb-4">
                 <span className="text-sm text-slate-600">Time:</span>
                 <input
                   type="time"
                   value={settings.regular_booking_start_time || '09:00'}
                   onChange={(e) => setSettings(prev => ({ ...prev, regular_booking_start_time: e.target.value }))}
                   className="px-2 py-1 border border-slate-300 rounded text-sm bg-white text-slate-800"
                 />
                 <span className="text-sm text-slate-500">to</span>
                 <input
                   type="time"
                   value={settings.regular_booking_end_time || '11:00'}
                   onChange={(e) => setSettings(prev => ({ ...prev, regular_booking_end_time: e.target.value }))}
                   className="px-2 py-1 border border-slate-300 rounded text-sm bg-white text-slate-800"
                 />
               </div>

               {/* Days Selection */}
               <div className="mb-4">
                 <span className="text-sm text-slate-600 block mb-2">Days:</span>
                 <div className="grid grid-cols-2 gap-2">
                   {daysOfWeek.map(day => (
                     <label key={day.value} className="flex items-center space-x-2 text-sm">
                       <input
                         type="checkbox"
                         checked={settings.regular_allowed_days.includes(day.value)}
                         onChange={() => handleRegularDayToggle(day.value)}
                         className="w-3 h-3 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500"
                       />
                       <span className="text-slate-700">{day.label}</span>
                     </label>
                   ))}
                 </div>
               </div>
             </div>

             {/* Manual Overrides */}
             <div>
               <div className="flex items-center space-x-2 mb-4">
                 <Zap className="w-5 h-5 text-orange-600" />
                 <h3 className="text-lg font-semibold text-slate-800">Manual Overrides</h3>
               </div>
               
               {/* Add Override Form */}
               <div className="space-y-3 mb-4">
                 <div className="flex items-center space-x-2">
                   <input
                     type="date"
                     className="px-2 py-1 border border-slate-300 rounded text-sm bg-white text-slate-800"
                     placeholder="Date"
                   />
                   <input
                     type="time"
                     className="px-2 py-1 border border-slate-300 rounded text-sm bg-white text-slate-800"
                   />
                   <span className="text-sm text-slate-500">to</span>
                   <input
                     type="time"
                     className="px-2 py-1 border border-slate-300 rounded text-sm bg-white text-slate-800"
                   />
                   <select className="px-2 py-1 border border-slate-300 rounded text-sm bg-white text-slate-800">
                     <option value="open">Open</option>
                     <option value="closed">Closed</option>
                   </select>
                   <button className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700">
                     Add
                   </button>
                 </div>
               </div>

               {/* Existing Overrides */}
               <div>
                 <span className="text-sm text-slate-600 block mb-2">Current Overrides:</span>
                 <div className="space-y-1">
                   <div className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded">
                     <span>Aug 6, 2025 • 15:00-17:00</span>
                     <div className="flex items-center space-x-2">
                       <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Open</span>
                       <button className="text-red-600 hover:text-red-800">×</button>
                     </div>
                   </div>
                   <div className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded">
                     <span>Aug 7, 2025 • 09:00-10:00</span>
                     <div className="flex items-center space-x-2">
                       <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Closed</span>
                       <button className="text-red-600 hover:text-red-800">×</button>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>

           {/* Save Button */}
           <div className="flex justify-center mt-6 pt-6 border-t border-slate-200">
             <button
               onClick={handleSave}
               disabled={saving}
               className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50"
             >
               {saving ? (
                 <>
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   <span>Saving...</span>
                 </>
               ) : (
                 <>
                   <Save className="w-4 h-4" />
                   <span>Save Settings</span>
                 </>
               )}
             </button>
           </div>

           {/* Quick Info */}
           <div className="mt-4 p-3 bg-slate-50 rounded-lg">
             <p className="text-xs text-slate-600 text-center">
               <strong>Booking Logic:</strong> Scheduled times OR manual opens, BUT manual closes block everything
             </p>
           </div>
         </div>

       </div>
     </div>
   )
} 