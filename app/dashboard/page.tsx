'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Users, BookOpen, FileText, AlertTriangle, TestTube, Plus, ArrowRight, User, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Booking, LabSlot } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navigation from '@/components/Navigation'

interface DashboardStats {
  totalSessions: number
  completed: number
  upcoming: number
}

export default function StudentDashboard() {
  const { user, appUser, isAdmin, signOut } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    completed: 0,
    upcoming: 0
  })
  const [nextSession, setNextSession] = useState<Booking | null>(null)
  const [recentSessions, setRecentSessions] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('=== DASHBOARD DEBUG ===')
    console.log('Dashboard useEffect - user:', !!user, 'appUser:', !!appUser, 'isAdmin:', isAdmin)
    console.log('User email:', user?.email)
    console.log('AppUser:', appUser)
    console.log('Loading state:', loading)
    
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, forcing loading to false')
        setLoading(false)
      }
    }, 15000) // 15 seconds timeout
    
    if (!user) {
      console.log('No user found, redirecting to login')
      router.push('/login')
      return
    }

    if (isAdmin) {
      console.log('User is admin, redirecting to admin')
      router.push('/admin')
      return
    }

    // If user exists but appUser doesn't, wait for AuthContext to create it
    if (user && !appUser) {
      console.log('User authenticated but appUser not loaded yet, waiting...')
      return
    }

    console.log('All checks passed, fetching dashboard data')
    fetchDashboardData()

    return () => {
      clearTimeout(timeout)
    }
  }, [user, appUser, isAdmin, router, loading])

  const fetchDashboardData = async () => {
    try {
      console.log('=== FETCHING DASHBOARD DATA ===')
      console.log('Fetching dashboard data for user:', user?.email)
      
      // Get the user from our database using email
      const { data: dbUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user?.email)
        .single()

      if (userError) {
        console.error('Error fetching user from database:', userError)
        toast.error('Failed to load user data')
        setLoading(false) // Make sure to set loading to false
        return
      }

      console.log('Found user in database:', dbUser)

      // Fetch user's bookings using the database user ID
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          lab_slot (*)
        `)
        .eq('user_id', dbUser.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching bookings:', error)
        throw error
      }

      console.log('Fetched bookings:', bookings)

      // Calculate stats
      const totalSessions = bookings?.length || 0
      const completed = bookings?.filter(b => b.status === 'booked').length || 0
      const upcoming = bookings?.filter(b => b.status === 'booked').length || 0

      console.log('Calculated stats:', { totalSessions, completed, upcoming })

      setStats({
        totalSessions,
        completed,
        upcoming
      })

      // Find next session
      const next = bookings?.find(b => 
        b.status === 'booked' && 
        new Date(b.lab_slot.date) > new Date()
      )
      setNextSession(next || null)

      // Get recent sessions
      setRecentSessions(bookings?.slice(0, 4) || [])

      console.log('Dashboard data loaded successfully')

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      console.log('Setting loading to false')
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
                  <span className="text-slate-700">{nextSession.lab_slot?.date ? new Date(nextSession.lab_slot.date).toLocaleDateString() : 'No date'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-700">{nextSession.lab_slot?.start_time || '00:00'} - {nextSession.lab_slot?.end_time || '00:00'}</span>
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
                        {session.lab_slot?.date ? new Date(session.lab_slot.date).toLocaleDateString() : 'No date'} • {session.lab_slot?.start_time || '00:00'} - {session.lab_slot?.end_time || '00:00'}
                      </div>
                    </div>
                                         <span className={`px-2 py-1 text-xs rounded-full ${
                       session.status === 'no-show' ? 'bg-orange-100 text-orange-800' :
                       'bg-blue-100 text-blue-800'
                     }`}>
                       {session.status === 'no-show' ? 'no-show' : 'booked'}
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