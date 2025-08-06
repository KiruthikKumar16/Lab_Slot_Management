'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Settings, Calendar, Clock, Save, AlertTriangle, Shield, Zap, CheckCircle, XCircle, Users, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { BookingSystemSettings } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navigation from '@/components/Navigation'

export default function BookingSettings() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [regularExpanded, setRegularExpanded] = useState(true)
  const [emergencyExpanded, setEmergencyExpanded] = useState(false)
  const [settings, setSettings] = useState<BookingSystemSettings>({
    id: 1,
    is_regular_booking_enabled: true,
    is_emergency_booking_open: false,
    emergency_booking_start: undefined,
    emergency_booking_end: undefined,
    emergency_allowed_days: [],
    regular_allowed_days: ['sunday'],
    message: 'Regular booking is available every Sunday. Check back on Sunday to book your lab session.',
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

  const handleEmergencyDayToggle = (day: string) => {
    setSettings(prev => ({
      ...prev,
      emergency_allowed_days: prev.emergency_allowed_days?.includes(day)
        ? prev.emergency_allowed_days.filter(d => d !== day)
        : [...(prev.emergency_allowed_days || []), day]
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

        {/* Regular Booking Settings */}
        <div className="glass-card p-6 mb-6">
          <button
            onClick={() => setRegularExpanded(!regularExpanded)}
            className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-semibold text-slate-800">Regular Booking (Sunday Schedule)</h2>
                <p className="text-sm text-slate-600">
                  {settings.is_regular_booking_enabled ? 'Enabled' : 'Disabled'} • {settings.regular_allowed_days.length} days selected
                </p>
              </div>
            </div>
            {regularExpanded ? (
              <ChevronDown className="w-6 h-6 text-slate-600" />
            ) : (
              <ChevronRight className="w-6 h-6 text-slate-600" />
            )}
          </button>
          
          {regularExpanded && (
            <div className="mt-6 space-y-6">
              {/* Regular Booking Status */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.is_regular_booking_enabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, is_regular_booking_enabled: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 bg-white border-blue-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">Enable Regular Booking</span>
                    <p className="text-sm text-slate-600">
                      Students can book lab sessions on regular scheduled days (typically Sundays)
                    </p>
                  </div>
                </div>
              </div>

              {/* Regular Allowed Days */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-4">Regular Booking Days</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {daysOfWeek.map(day => (
                    <label key={day.value} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.regular_allowed_days.includes(day.value)}
                        onChange={() => handleRegularDayToggle(day.value)}
                        className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Regular Message */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Regular Booking Message</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea
                    value={settings.message}
                    onChange={(e) => setSettings(prev => ({ ...prev, message: e.target.value }))}
                    rows={3}
                    className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
                    placeholder="Message to show when regular booking is closed..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Emergency Booking Settings */}
        <div className="glass-card p-6 mb-6">
          <button
            onClick={() => setEmergencyExpanded(!emergencyExpanded)}
            className="w-full flex items-center justify-between p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-semibold text-slate-800">Emergency Booking (Admin Override)</h2>
                <p className="text-sm text-slate-600">
                  {settings.is_emergency_booking_open ? 'Open' : 'Closed'} • {settings.emergency_allowed_days?.length || 0} days selected
                </p>
              </div>
            </div>
            {emergencyExpanded ? (
              <ChevronDown className="w-6 h-6 text-slate-600" />
            ) : (
              <ChevronRight className="w-6 h-6 text-slate-600" />
            )}
          </button>
          
          {emergencyExpanded && (
            <div className="mt-6 space-y-6">
              {/* Emergency Booking Status */}
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.is_emergency_booking_open}
                    onChange={(e) => setSettings(prev => ({ ...prev, is_emergency_booking_open: e.target.checked }))}
                    className="w-5 h-5 text-orange-600 bg-white border-orange-300 rounded focus:ring-orange-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">Enable Emergency Booking</span>
                    <p className="text-sm text-slate-600">
                      Open booking on weekdays when slots become available due to cancellations
                    </p>
                  </div>
                </div>
              </div>

              {/* Emergency Time Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Emergency Start Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={settings.emergency_booking_start || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, emergency_booking_start: e.target.value }))}
                      className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Emergency End Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={settings.emergency_booking_end || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, emergency_booking_end: e.target.value }))}
                      className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Allowed Days */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-4">Emergency Booking Days</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {daysOfWeek.map(day => (
                    <label key={day.value} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-orange-300 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.emergency_allowed_days?.includes(day.value) || false}
                        onChange={() => handleEmergencyDayToggle(day.value)}
                        className="w-4 h-4 text-orange-600 bg-white border-slate-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium text-slate-700">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Emergency Message */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Emergency Booking Message</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea
                    value={settings.emergency_message}
                    onChange={(e) => setSettings(prev => ({ ...prev, emergency_message: e.target.value }))}
                    rows={3}
                    className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-slate-800"
                    placeholder="Message to show when emergency booking is open..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Quick Actions</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setSettings(prev => ({
                ...prev,
                is_emergency_booking_open: true,
                emergency_booking_start: new Date().toISOString().slice(0, 16),
                emergency_booking_end: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16), // 4 hours from now
                emergency_allowed_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
              }))}
              className="flex items-center justify-center space-x-3 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Zap className="w-5 h-5" />
              <span>Open Emergency Booking (4 hours)</span>
            </button>
            
            <button
              onClick={() => setSettings(prev => ({
                ...prev,
                is_emergency_booking_open: false,
                emergency_booking_start: undefined,
                emergency_booking_end: undefined
              }))}
              className="flex items-center justify-center space-x-3 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <XCircle className="w-5 h-5" />
              <span>Close Emergency Booking</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="glass-card p-6">
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 flex items-center space-x-3 disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Settings...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 