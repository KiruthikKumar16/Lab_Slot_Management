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

        {/* Current Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">Regular Booking</p>
                <p className={`text-2xl font-bold ${settings.is_regular_booking_enabled ? 'text-green-600' : 'text-red-600'}`}>
                  {settings.is_regular_booking_enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                settings.is_regular_booking_enabled 
                  ? 'bg-gradient-to-br from-green-500 to-green-600' 
                  : 'bg-gradient-to-br from-red-500 to-red-600'
              }`}>
                {settings.is_regular_booking_enabled ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : (
                  <XCircle className="w-6 h-6 text-white" />
                )}
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">Emergency Booking</p>
                <p className={`text-2xl font-bold ${settings.is_emergency_booking_open ? 'text-orange-600' : 'text-gray-600'}`}>
                  {settings.is_emergency_booking_open ? 'Open' : 'Closed'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                settings.is_emergency_booking_open 
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600' 
                  : 'bg-gradient-to-br from-gray-500 to-gray-600'
              }`}>
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">Regular Days</p>
                <p className="text-2xl font-bold text-blue-600">{settings.regular_allowed_days.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">Emergency Days</p>
                <p className="text-2xl font-bold text-purple-600">
                  {settings.emergency_allowed_days?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

                 {/* Booking Configuration Header */}
         <div className="glass-card p-6 mb-6">
           <div className="flex items-center space-x-3 mb-4">
             <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
               <Settings className="w-5 h-5 text-white" />
             </div>
             <h2 className="text-xl font-semibold text-slate-800">🔧 Booking Configuration</h2>
           </div>
           <p className="text-slate-600">
             Configure your lab booking system with scheduled recurring times and manual overrides.
           </p>
         </div>

                          {/* Scheduled Booking Section */}
         <div className="glass-card p-6 mb-6">
           <div className="flex items-center space-x-3 mb-6">
             <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
               <Calendar className="w-5 h-5 text-white" />
             </div>
             <h2 className="text-xl font-semibold text-slate-800">🗓️ Scheduled Booking (Recurring Timetable)</h2>
           </div>
           <p className="text-slate-600 mb-6">Define your regular weekly booking windows. These repeat every week.</p>
           
           <div className="space-y-6">
             {/* Enable Scheduled Booking */}
             <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
               <div className="flex items-center space-x-3">
                 <input
                   type="checkbox"
                   checked={settings.is_regular_booking_enabled}
                   onChange={(e) => setSettings(prev => ({ ...prev, is_regular_booking_enabled: e.target.checked }))}
                   className="w-5 h-5 text-blue-600 bg-white border-blue-300 rounded focus:ring-blue-500"
                 />
                 <div>
                   <span className="font-semibold text-slate-800">🟩 Enable Scheduled Booking</span>
                   <p className="text-sm text-slate-600">
                     (Students can book lab sessions during these recurring windows)
                   </p>
                 </div>
               </div>
             </div>

             {/* Days and Times Selection */}
             <div>
               <h3 className="text-lg font-semibold text-slate-800 mb-4">Select Days and Times:</h3>
               <div className="space-y-4">
                 {daysOfWeek.map(day => (
                   <div key={day.value} className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-slate-200">
                     <input
                       type="checkbox"
                       checked={settings.regular_allowed_days.includes(day.value)}
                       onChange={() => handleRegularDayToggle(day.value)}
                       className="w-5 h-5 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500"
                     />
                     <span className="font-medium text-slate-700 min-w-[80px]">{day.label}</span>
                     <div className="flex items-center space-x-2">
                       <span className="text-slate-500">Start Time:</span>
                       <input
                         type="time"
                         value={settings.regular_booking_start_time || '09:00'}
                         onChange={(e) => setSettings(prev => ({ ...prev, regular_booking_start_time: e.target.value }))}
                         className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
                       />
                       <span className="text-slate-500">–</span>
                       <span className="text-slate-500">End Time:</span>
                       <input
                         type="time"
                         value={settings.regular_booking_end_time || '11:00'}
                         onChange={(e) => setSettings(prev => ({ ...prev, regular_booking_end_time: e.target.value }))}
                         className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
                       />
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             {/* Info Message */}
             <div className="p-4 bg-blue-50 rounded-xl">
               <h4 className="font-semibold text-slate-800 mb-2">📝 Info Message:</h4>
               <p className="text-sm text-slate-600">
                 Students can book lab sessions on the selected days and times each week.
                 Bookings will automatically open during these scheduled windows.
               </p>
             </div>
           </div>
         </div>

                          {/* Manual Override Section */}
         <div className="glass-card p-6 mb-6">
           <div className="flex items-center space-x-3 mb-6">
             <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
               <Zap className="w-5 h-5 text-white" />
             </div>
             <h2 className="text-xl font-semibold text-slate-800">✋ Manual Booking Overrides (Date-specific Control)</h2>
           </div>
           <p className="text-slate-600 mb-6">Use this section to add extra booking time or block bookings on specific dates.</p>
           
           <div className="space-y-6">
             {/* Add Manual Override */}
             <div className="p-4 bg-orange-50 rounded-xl">
               <h3 className="font-semibold text-slate-800 mb-4">🔘 Add Manual Override:</h3>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
                   <input
                     type="date"
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-slate-800"
                     placeholder="Select date"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
                   <input
                     type="time"
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-slate-800"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
                   <input
                     type="time"
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-slate-800"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                   <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-slate-800">
                     <option value="open">Open</option>
                     <option value="closed">Closed</option>
                   </select>
                 </div>
               </div>
               <div className="mt-4">
                 <button className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-2 rounded-lg font-semibold hover:from-orange-700 hover:to-orange-800 transition-all duration-300 flex items-center space-x-2">
                   <span>➕</span>
                   <span>Add</span>
                 </button>
               </div>
             </div>

             {/* Existing Overrides Table */}
             <div>
               <h3 className="text-lg font-semibold text-slate-800 mb-4">📋 Existing Overrides:</h3>
               <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                 <table className="w-full">
                   <thead className="bg-slate-50">
                     <tr>
                       <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Date</th>
                       <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Time Slot</th>
                       <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                       <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-200">
                     <tr className="hover:bg-slate-50">
                       <td className="px-4 py-3 text-sm text-slate-700">Aug 6, 2025</td>
                       <td className="px-4 py-3 text-sm text-slate-700">15:00 – 17:00</td>
                       <td className="px-4 py-3">
                         <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                           Open
                         </span>
                       </td>
                       <td className="px-4 py-3">
                         <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                           🗑 Remove
                         </button>
                       </td>
                     </tr>
                     <tr className="hover:bg-slate-50">
                       <td className="px-4 py-3 text-sm text-slate-700">Aug 7, 2025</td>
                       <td className="px-4 py-3 text-sm text-slate-700">09:00 – 10:00</td>
                       <td className="px-4 py-3">
                         <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                           Closed
                         </span>
                       </td>
                       <td className="px-4 py-3">
                         <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                           🗑 Remove
                         </button>
                       </td>
                     </tr>
                   </tbody>
                 </table>
               </div>
             </div>

             {/* Info Message */}
             <div className="p-4 bg-orange-50 rounded-xl">
               <h4 className="font-semibold text-slate-800 mb-2">📝 Info Message:</h4>
               <p className="text-sm text-slate-600">
                 Manual windows do not cancel regular booking times unless they overlap.
                 Manual "Closed" windows block booking even during scheduled hours.
               </p>
             </div>
           </div>
         </div>

                          {/* Save Button */}
         <div className="glass-card p-6 mb-6">
           <div className="flex justify-center">
             <button
               onClick={handleSave}
               disabled={saving}
               className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 flex items-center space-x-3 disabled:opacity-50 shadow-lg hover:shadow-xl"
             >
               {saving ? (
                 <>
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   <span>Saving Settings...</span>
                 </>
               ) : (
                 <>
                   <Save className="w-5 h-5" />
                   <span>💾 Save All Settings</span>
                 </>
               )}
             </button>
           </div>
         </div>

         {/* Final Behavior Summary */}
         <div className="glass-card p-6">
           <div className="flex items-center space-x-3 mb-4">
             <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
               <CheckCircle className="w-5 h-5 text-white" />
             </div>
             <h3 className="text-lg font-semibold text-slate-800">✅ Final Behavior (Summary Below the Form)</h3>
           </div>
           <div className="bg-green-50 rounded-xl p-4">
             <p className="text-sm text-slate-700 mb-3">
               <strong>Booking is allowed when:</strong>
             </p>
             <ul className="text-sm text-slate-600 space-y-1 ml-4">
               <li>• The current time is within any scheduled window, OR</li>
               <li>• The time falls within a manual OPEN override,</li>
               <li>• BUT booking is blocked during any manual CLOSED window.</li>
             </ul>
           </div>
         </div>

       </div>
     </div>
   )
} 