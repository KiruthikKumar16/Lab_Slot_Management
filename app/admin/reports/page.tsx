'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { BarChart3, Calendar, Users, Download, TrendingUp, TrendingDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Booking, LabSlot, User as AppUser } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navigation from '@/components/Navigation'

interface ReportData {
  totalBookings: number
  totalStudents: number
  totalSlots: number
  noShows: number
  cancellations: number
  attendanceRate: number
  weeklyBookings: number[]
  monthlyBookings: number[]
}

export default function AdminReports() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [reportData, setReportData] = useState<ReportData>({
    totalBookings: 0,
    totalStudents: 0,
    totalSlots: 0,
    noShows: 0,
    cancellations: 0,
    attendanceRate: 0,
    weeklyBookings: [],
    monthlyBookings: []
  })
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

    fetchReportData()
  }, [user, isAdmin, router])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data
      const [bookingsResponse, studentsResponse, slotsResponse] = await Promise.all([
        supabase.from('bookings').select('*'),
        supabase.from('users').select('*').eq('role', 'student'),
        supabase.from('lab_slots').select('*')
      ])

      if (bookingsResponse.error) throw bookingsResponse.error
      if (studentsResponse.error) throw studentsResponse.error
      if (slotsResponse.error) throw slotsResponse.error

      const bookings = bookingsResponse.data || []
      const students = studentsResponse.data || []
      const slots = slotsResponse.data || []

      // Calculate metrics
      const noShows = bookings.filter(b => b.status === 'no-show').length
      const cancellations = bookings.filter(b => b.status === 'cancelled').length
      const completedBookings = bookings.filter(b => b.status === 'booked').length
      const attendanceRate = bookings.length > 0 ? ((completedBookings - noShows) / bookings.length) * 100 : 0

      // Calculate weekly bookings (last 4 weeks)
      const weeklyBookings = []
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - (i * 7))
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        
        const weekBookings = bookings.filter(b => {
          const bookingDate = new Date(b.created_at)
          return bookingDate >= weekStart && bookingDate <= weekEnd
        }).length
        
        weeklyBookings.push(weekBookings)
      }

      // Calculate monthly bookings (last 6 months)
      const monthlyBookings = []
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date()
        monthStart.setMonth(monthStart.getMonth() - i)
        monthStart.setDate(1)
        const monthEnd = new Date(monthStart)
        monthEnd.setMonth(monthEnd.getMonth() + 1)
        monthEnd.setDate(0)
        
        const monthBookings = bookings.filter(b => {
          const bookingDate = new Date(b.created_at)
          return bookingDate >= monthStart && bookingDate <= monthEnd
        }).length
        
        monthlyBookings.push(monthBookings)
      }

      setReportData({
        totalBookings: bookings.length,
        totalStudents: students.length,
        totalSlots: slots.length,
        noShows,
        cancellations,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        weeklyBookings,
        monthlyBookings
      })

    } catch (error) {
      console.error('Error fetching report data:', error)
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = () => {
    // Simple CSV export
    const csvContent = `Report Date,${new Date().toLocaleDateString()}
Total Bookings,${reportData.totalBookings}
Total Students,${reportData.totalStudents}
Total Slots,${reportData.totalSlots}
No Shows,${reportData.noShows}
Cancellations,${reportData.cancellations}
Attendance Rate,${reportData.attendanceRate}%`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lab-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success('Report exported successfully')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation currentPage="reports" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Reports & Analytics
          </h1>
          <p className="text-slate-600 text-lg">Generate reports and view system analytics</p>
        </div>

        {/* Export Button */}
        <div className="mb-8">
          <button
            onClick={handleExportReport}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Export Report</span>
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">Total Bookings</p>
                <p className="text-3xl font-bold text-slate-800">{reportData.totalBookings}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">Total Students</p>
                <p className="text-3xl font-bold text-green-600">{reportData.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">Attendance Rate</p>
                <p className="text-3xl font-bold text-purple-600">{reportData.attendanceRate}%</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">No Shows</p>
                <p className="text-3xl font-bold text-orange-600">{reportData.noShows}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Trends */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Weekly Booking Trends</h3>
            <div className="space-y-3">
              {reportData.weeklyBookings.map((count, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-slate-600">Week {4 - index}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((count / Math.max(...reportData.weeklyBookings)) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-slate-800">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Monthly Booking Trends</h3>
            <div className="space-y-3">
              {reportData.monthlyBookings.map((count, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-slate-600">Month {6 - index}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((count / Math.max(...reportData.monthlyBookings)) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-slate-800">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="mt-8">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Additional Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{reportData.totalSlots}</div>
                <div className="text-sm text-slate-600">Total Lab Slots</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{reportData.cancellations}</div>
                <div className="text-sm text-slate-600">Cancellations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {reportData.totalBookings > 0 ? Math.round((reportData.totalBookings / reportData.totalSlots) * 100) / 100 : 0}
                </div>
                <div className="text-sm text-slate-600">Avg Bookings per Slot</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 