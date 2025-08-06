'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Settings, Calendar, Clock, Save, AlertTriangle } from 'lucide-react'
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Booking System Settings
          </h1>
          <p className="text-slate-600 text-lg">Control when students can book lab sessions</p>
        </div>

        {/* Regular Booking Settings */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Regular Booking (Sunday Schedule)</h2>
          <div className="space-y-6">
            {/* Regular Booking Status */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.is_regular_booking_enabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, is_regular_booking_enabled: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800">Enable Regular Booking</span>
              </label>
              <p className="text-sm text-slate-600 ml-7 mt-1">
                Students can book lab sessions on regular scheduled days (typically Sundays)
              </p>
            </div>

            {/* Regular Allowed Days */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Regular Booking Days</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {daysOfWeek.map(day => (
                  <label key={day.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.regular_allowed_days.includes(day.value)}
                      onChange={() => handleRegularDayToggle(day.value)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Regular Message */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Regular Booking Message</label>
              <textarea
                value={settings.message}
                onChange={(e) => setSettings(prev => ({ ...prev, message: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                placeholder="Message to show when regular booking is closed..."
              />
            </div>
          </div>
        </div>

        {/* Emergency Booking Settings */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Emergency Booking (Admin Override)</h2>
          <div className="space-y-6">
            {/* Emergency Booking Status */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.is_emergency_booking_open}
                  onChange={(e) => setSettings(prev => ({ ...prev, is_emergency_booking_open: e.target.checked }))}
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="font-semibold text-slate-800">Enable Emergency Booking</span>
              </label>
              <p className="text-sm text-slate-600 ml-7 mt-1">
                Open booking on weekdays when slots become available due to cancellations
              </p>
            </div>

            {/* Emergency Time Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Emergency Start Time</label>
                <input
                  type="datetime-local"
                  value={settings.emergency_booking_start || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, emergency_booking_start: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Emergency End Time</label>
                <input
                  type="datetime-local"
                  value={settings.emergency_booking_end || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, emergency_booking_end: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-slate-800"
                />
              </div>
            </div>

            {/* Emergency Allowed Days */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Emergency Booking Days</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {daysOfWeek.map(day => (
                  <label key={day.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.emergency_allowed_days?.includes(day.value) || false}
                      onChange={() => handleEmergencyDayToggle(day.value)}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-slate-700">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Emergency Message */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Emergency Booking Message</label>
              <textarea
                value={settings.emergency_message}
                onChange={(e) => setSettings(prev => ({ ...prev, emergency_message: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-slate-800"
                placeholder="Message to show when emergency booking is open..."
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setSettings(prev => ({
                ...prev,
                is_emergency_booking_open: true,
                emergency_booking_start: new Date().toISOString().slice(0, 16),
                emergency_booking_end: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16), // 4 hours from now
                emergency_allowed_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
              }))}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300"
            >
              Open Emergency Booking (4 hours)
            </button>
            <button
              onClick={() => setSettings(prev => ({
                ...prev,
                is_emergency_booking_open: false,
                emergency_booking_start: undefined,
                emergency_booking_end: undefined
              }))}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300"
            >
              Close Emergency Booking
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="glass-card p-6">
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
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

        {/* Current Status */}
        <div className="mt-6 glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Current Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${settings.is_regular_booking_enabled ? 'bg-blue-500' : 'bg-gray-500'}`} />
              <span className="text-slate-700">
                Regular Booking: <span className="font-medium">{settings.is_regular_booking_enabled ? 'Enabled' : 'Disabled'}</span>
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${settings.is_emergency_booking_open ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-slate-700">
                Emergency Booking: <span className="font-medium">{settings.is_emergency_booking_open ? 'Open' : 'Closed'}</span>
              </span>
            </div>
            <div className="text-slate-700">
              Regular Days: <span className="font-medium">{settings.regular_allowed_days.length > 0 ? settings.regular_allowed_days.join(', ') : 'None'}</span>
            </div>
            <div className="text-slate-700">
              Emergency Days: <span className="font-medium">{settings.emergency_allowed_days && settings.emergency_allowed_days.length > 0 ? settings.emergency_allowed_days.join(', ') : 'None'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 