'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Users, BookOpen, FileText, AlertTriangle, TestTube, Plus, ArrowRight, User, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LabSlot } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navigation from '@/components/Navigation'

interface DashboardStats {
  totalSessions: number
  completed: number
  upcoming: number
}

interface BookedSlot extends LabSlot {
  user?: {
    email: string
  }
}

export default function StudentDashboard() {
  const { user, appUser, isAdmin, signOut } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    completed: 0,
    upcoming: 0
  })
  const [nextSession, setNextSession] = useState<BookedSlot | null>(null)
  const [recentSessions, setRecentSessions] = useState<BookedSlot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false)
      }
    }, 15000) // 15 seconds timeout
    
    if (!user) {
      router.push('/login')
      return
    }

    if (isAdmin) {
      router.push('/admin')
      return
    }

    // If user exists but appUser doesn't, wait for AuthContext to create it
    if (user && !appUser) {
      return
    }

    fetchDashboardData()

    return () => {
      clearTimeout(timeout)
    }
  }, [user, appUser, isAdmin, router, loading])

  const fetchDashboardData = async () => {
    try {
      // Get the user from our database using email
      const { data: dbUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user?.email)
        .single()

      if (userError) {
        console.error('Error fetching user from database:', userError)
        toast.error('Failed to load user data')
        setLoading(false)
        return
      }

      // Fetch user's booked slots using the database user ID
      const { data: bookedSlots, error } = await supabase
        .from('lab_slots')
        .select(`*`)
        .eq('booked_by', dbUser.id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Error fetching booked slots:', error)
        throw error
      }

      // Calculate stats
      const totalSessions = bookedSlots?.length || 0
      const completed = bookedSlots?.filter(slot => new Date(slot.date) < new Date()).length || 0
      const upcoming = bookedSlots?.filter(slot => new Date(slot.date) >= new Date()).length || 0

      setStats({
        totalSessions,
        completed,
        upcoming
      })

      // Get next session (first upcoming session)
      const upcomingSessions = bookedSlots?.filter(slot => new Date(slot.date) >= new Date()) || []
      setNextSession(upcomingSessions[0] || null)

      // Get recent sessions (last 5)
      setRecentSessions(bookedSlots?.slice(0, 5) || [])
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
      <Navigation currentPage="dashboard" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Welcome back, {appUser?.email?.split('@')[0] || user?.email?.split('@')[0] || 'Student'}
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
                  <span className="text-slate-700">{nextSession.date ? new Date(nextSession.date).toLocaleDateString() : 'No date'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-700">{nextSession.start_time || '00:00'} - {nextSession.end_time || '00:00'}</span>
                </div>
                <div className="text-slate-700 font-medium">
                  Lab Session
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
                        Lab Session {index + 1}
                      </div>
                      <div className="text-sm text-slate-600">
                        {session.date ? new Date(session.date).toLocaleDateString() : 'No date'} • {session.start_time || '00:00'} - {session.end_time || '00:00'}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      session.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                      session.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {session.status}
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