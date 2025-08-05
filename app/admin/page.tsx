'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Users, BookOpen, FileText, AlertTriangle, TestTube, User, LogOut, Settings, BarChart3, Plus, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Booking, LabSlot, User as AppUser } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navigation from '@/components/Navigation'

interface AdminStats {
  totalBookings: number
  todayBookings: number
  noShows: number
  totalStudents: number
}

export default function AdminDashboard() {
  const { user, appUser, isAdmin, signOut } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats>({
    totalBookings: 0,
    todayBookings: 0,
    noShows: 0,
    totalStudents: 0
  })
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!isAdmin) {
      router.push('/dashboard')
      return
    }

    fetchAdminData()
  }, [user, isAdmin, router])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      
      // Fetch all bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          lab_slot (*),
          user (*)
        `)
        .order('created_at', { ascending: false })

      if (bookingsError) throw bookingsError

      // Fetch all students
      const { data: students, error: studentsError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')

      if (studentsError) throw studentsError

      // Calculate stats
      const today = new Date().toISOString().split('T')[0]
      const todayBookings = bookings?.filter(b => b.lab_slot?.date === today) || []
      const noShows = bookings?.filter(b => b.status === 'no-show') || []

      setStats({
        totalBookings: bookings?.length || 0,
        todayBookings: todayBookings.length,
        noShows: noShows.length,
        totalStudents: students?.length || 0
      })

      setRecentBookings(bookings?.slice(0, 5) || [])

    } catch (error) {
      console.error('Error fetching admin data:', error)
      toast.error('Failed to load admin data')
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
          <p className="text-slate-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation currentPage="admin" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Welcome back, {appUser?.email?.split('@')[0] || user?.email?.split('@')[0] || 'Admin'}
          </h2>
          <p className="text-slate-600">
            Manage lab sessions, students, and generate reports
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">Total Bookings</p>
                <p className="text-3xl font-bold text-slate-800">{stats.totalBookings}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">Today's Bookings</p>
                <p className="text-3xl font-bold text-green-600">{stats.todayBookings}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">No Shows</p>
                <p className="text-3xl font-bold text-orange-600">{stats.noShows}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">Total Students</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">Quick Actions</h3>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => router.push('/admin/lab-slots')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-blue-700 hover:to-indigo-800 transition-all duration-300"
              >
                <Settings className="w-5 h-5" />
                <span>Manage Lab Slots</span>
              </button>

              <button
                onClick={() => router.push('/admin/bookings')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-green-700 hover:to-emerald-800 transition-all duration-300"
              >
                <BookOpen className="w-5 h-5" />
                <span>View All Bookings</span>
              </button>

              <button
                onClick={() => router.push('/admin/students')}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-purple-700 hover:to-violet-800 transition-all duration-300"
              >
                <Users className="w-5 h-5" />
                <span>Student Management</span>
              </button>

              <button
                onClick={() => router.push('/admin/reports')}
                className="w-full bg-gradient-to-r from-orange-600 to-red-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-orange-700 hover:to-red-800 transition-all duration-300"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Generate Reports</span>
              </button>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">Recent Bookings</h3>
              <button 
                onClick={() => router.push('/admin/bookings')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">
                        {booking.user?.email || 'Unknown Student'}
                      </div>
                      <div className="text-sm text-slate-600">
                        {booking.lab_slot?.date} • {booking.lab_slot?.start_time} - {booking.lab_slot?.end_time}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      booking.status === 'no-show' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-center py-4">
                  No recent bookings
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 