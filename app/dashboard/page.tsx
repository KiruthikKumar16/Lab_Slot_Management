'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Users, BookOpen, FileText, AlertTriangle, TestTube, Plus, ArrowRight, User, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Booking, LabSlot } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface DashboardStats {
  totalSessions: number
  completed: number
  upcoming: number
}

export default function StudentDashboard() {
  const { user, appUser, isAdmin, signOut } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 12,
    completed: 8,
    upcoming: 1
  })
  const [nextSession, setNextSession] = useState<Booking | null>(null)
  const [recentSessions, setRecentSessions] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (isAdmin) {
      router.push('/admin')
      return
    }

    fetchDashboardData()
  }, [user, isAdmin, router])

  const fetchDashboardData = async () => {
    try {
      // Fetch user's bookings
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          lab_slots (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calculate stats
      const totalSessions = bookings?.length || 0
      const completed = bookings?.filter(b => b.status === 'completed').length || 0
      const upcoming = bookings?.filter(b => b.status === 'booked').length || 0

      setStats({
        totalSessions,
        completed,
        upcoming
      })

      // Find next session
      const next = bookings?.find(b => 
        b.status === 'booked' && 
        new Date(b.lab_slots.date) > new Date()
      )
      setNextSession(next || null)

      // Get recent sessions
      setRecentSessions(bookings?.slice(0, 4) || [])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <TestTube className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">ChemLab Pro</h1>
                <p className="text-xs text-slate-600">University Lab Management</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
                Dashboard
              </button>
              <button 
                onClick={() => router.push('/book')}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
              >
                Book Slot
              </button>
              <button 
                onClick={() => router.push('/my-sessions')}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
              >
                My Sessions
              </button>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">John Doe</p>
                <p className="text-xs text-slate-600">Student • John.Doe</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <button onClick={handleSignOut} className="text-slate-600 hover:text-slate-800">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Welcome back, John Doe
          </h2>
          <p className="text-slate-600">
            Manage your lab sessions and track your progress
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">Total Sessions</p>
                <p className="text-3xl font-bold text-slate-800">{stats.totalSessions}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">Upcoming</p>
                <p className="text-3xl font-bold text-blue-600">{stats.upcoming}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Next Lab Session */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">Next Lab Session</h3>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">booked</span>
            </div>
            
            {nextSession ? (
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-700">2024-01-15</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-700">14:00 - 16:00</span>
                </div>
                <div className="text-slate-700 font-medium">
                  Organic Chemistry Lab A
                </div>
              </div>
            ) : (
              <div className="text-slate-500 mb-6">
                No upcoming sessions
              </div>
            )}

            <button
              onClick={() => router.push('/book')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-blue-700 hover:to-indigo-800 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              <span>Book New Session</span>
            </button>
          </div>

          {/* Recent Sessions */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">Recent Sessions</h3>
              <button 
                onClick={() => router.push('/my-sessions')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              {recentSessions.length > 0 ? (
                recentSessions.map((session, index) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">
                        {session.lab_slot?.date ? `Lab Session ${index + 1}` : 'Organic Chemistry Lab A'}
                      </div>
                      <div className="text-sm text-slate-600">
                        {session.lab_slot?.date ? new Date(session.lab_slot.date).toLocaleDateString() : '2024-01-15'} • {session.lab_slot?.start_time || '14:00'} - {session.lab_slot?.end_time || '16:00'}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      session.status === 'completed' ? 'bg-green-100 text-green-800' :
                      session.status === 'no-show' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {session.status === 'completed' ? 'completed' : 
                       session.status === 'no-show' ? 'no-show' : 'booked'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-center py-4">
                  No recent sessions
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 