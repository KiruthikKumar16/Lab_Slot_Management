'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Calendar, Download, FileText, Users, AlertTriangle, BarChart3, TrendingUp, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navigation from '@/components/Navigation'

interface ReportData {
  weeklyAttendance: {
    week: string
    totalBookings: number
    completed: number
    noShows: number
    cancelled: number
    completionRate: number
  }[]
  summary: {
    totalBookings: number
    completed: number
    noShows: number
    successRate: number
    totalSamples: number
  }
  sampleAnalysis: {
    totalSamples: number
    completionRate: number
    avgSamplesPerSession: number
  }
  studentPerformance: {
    student: string
    email: string
    total: number
    completed: number
    cancelled: number
    noShows: number
    successRate: number
  }[]
}

export default function AdminReports() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('Weekly Attendance')
  const [generatingExport, setGeneratingExport] = useState(false)

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
      
      // Fetch all bookings via server API (admin scope)
      const res = await fetch('/api/bookings?all=true')
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || 'Failed to fetch bookings')
      const processedData = processReportData(payload?.bookings || [])
      setReportData(processedData)
    } catch (error) {
      console.error('Error fetching report data:', error)
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const processReportData = (bookings: any[]): ReportData => {
    const now = new Date()
    const fourWeeksAgo = new Date(now.getTime() - (4 * 7 * 24 * 60 * 60 * 1000))
    
    // Filter bookings from last 4 weeks (by lab slot date if available)
    const recentBookings = bookings.filter((booking: any) => {
      const refDate = booking?.lab_slot?.date ? new Date(booking.lab_slot.date) : new Date(booking.created_at)
      return refDate >= fourWeeksAgo
    })

    // Group by weeks
    const weeklyData: {
      week: string
      totalBookings: number
      completed: number
      noShows: number
      cancelled: number
      completionRate: number
    }[] = []
    
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(fourWeeksAgo.getTime() + (i * 7 * 24 * 60 * 60 * 1000))
      const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000))
      
      const weekBookings = recentBookings.filter((booking: any) => {
        const bookingDate = booking?.lab_slot?.date ? new Date(booking.lab_slot.date) : new Date(booking.created_at)
        return bookingDate >= weekStart && bookingDate < weekEnd
      })

      const totalBookings = weekBookings.length
      const completed = weekBookings.filter((b: any) => b.status === 'booked' && new Date(b?.lab_slot?.date || b.created_at) < now).length
      const noShows = weekBookings.filter(b => b.status === 'no-show').length
      const cancelled = weekBookings.filter(b => b.status === 'cancelled').length
      const completionRate = totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : 0

      weeklyData.push({
        week: `Week ${i + 1}`,
        totalBookings,
        completed,
        noShows,
        cancelled,
        completionRate
      })
    }

    // Calculate summary
    const totalBookings = recentBookings.length
    const completed = recentBookings.filter((b: any) => b.status === 'booked' && new Date(b?.lab_slot?.date || b.created_at) < now).length
    const noShows = recentBookings.filter((b: any) => b.status === 'no-show').length
    const successRate = totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : 0
    const totalSamples = recentBookings.reduce((sum: number, booking: any) => sum + (booking.samples_count || 0), 0)

    // Sample analysis
    const sampleAnalysis = {
      totalSamples,
      completionRate: completed > 0 ? Math.round((totalSamples / completed) * 100) : 0,
      avgSamplesPerSession: completed > 0 ? Math.round(totalSamples / completed) : 0
    }

    // Student performance (by email)
    const emailToStats: Record<string, { email: string; student: string; total: number; completed: number; cancelled: number; noShows: number }> = {}
    for (const b of recentBookings) {
      const email = b?.user?.email || 'unknown'
      const name = email.split('@')[0]
      if (!emailToStats[email]) {
        emailToStats[email] = { email, student: name, total: 0, completed: 0, cancelled: 0, noShows: 0 }
      }
      emailToStats[email].total += 1
      if (b.status === 'cancelled') emailToStats[email].cancelled += 1
      else if (b.status === 'no-show') emailToStats[email].noShows += 1
      else if (b.status === 'booked' && new Date(b?.lab_slot?.date || b.created_at) < now) emailToStats[email].completed += 1
    }
    const studentPerformance = Object.values(emailToStats)
      .map(s => ({
        ...s,
        successRate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total)

    return {
      weeklyAttendance: weeklyData,
      summary: {
        totalBookings,
        completed,
        noShows,
        successRate,
        totalSamples
      },
      sampleAnalysis,
      studentPerformance
    }
  }

  const exportCSV = async () => {
    try {
      setGeneratingExport(true)
      
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: reportType,
          data: reportData
        })
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportType.toLowerCase().replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('CSV exported successfully')
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast.error('Failed to export CSV')
    } finally {
      setGeneratingExport(false)
    }
  }

  const exportPDF = async () => {
    try {
      setGeneratingExport(true)
      
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: reportType,
          format: 'pdf',
          data: reportData
        })
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportType.toLowerCase().replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('PDF exported successfully')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Failed to export PDF')
    } finally {
      setGeneratingExport(false)
    }
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Reports & Analytics
          </h1>
          <p className="text-slate-600">
            Generate and export detailed lab usage reports
          </p>
        </div>

        {/* Report Controls */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-slate-600" />
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800"
              >
                <option value="Weekly Attendance">Weekly Attendance</option>
                <option value="Sample Analysis">Sample Analysis</option>
                <option value="Student Performance">Student Performance</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={exportCSV}
                disabled={generatingExport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              
              <button
                onClick={exportPDF}
                disabled={generatingExport}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Attendance Table */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">Weekly Attendance</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-800">Week</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-800">Total Bookings</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-800">Completed</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-800">No-Shows</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-800">Cancelled</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-800">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportData?.weeklyAttendance.map((week, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-800">{week.week}</td>
                    <td className="px-6 py-4 text-slate-700">{week.totalBookings}</td>
                    <td className="px-6 py-4 text-green-600 font-medium">{week.completed}</td>
                    <td className="px-6 py-4 text-orange-600 font-medium">{week.noShows}</td>
                    <td className="px-6 py-4 text-red-600 font-medium">{week.cancelled}</td>
                    <td className="px-6 py-4 text-blue-600 font-medium">{week.completionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">Total Bookings</p>
                <p className="text-3xl font-bold text-slate-800">{reportData?.summary.totalBookings || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">Completed</p>
                <p className="text-3xl font-bold text-green-600">{reportData?.summary.completed || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">No-Shows</p>
                <p className="text-3xl font-bold text-orange-600">{reportData?.summary.noShows || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium">Success Rate</p>
                <p className="text-3xl font-bold text-purple-600">{reportData?.summary.successRate || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Sample Analysis */}
        <div className="glass-card p-6 mt-8">
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-slate-800">Sample Analysis</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {reportData?.sampleAnalysis.totalSamples || 0}
              </div>
              <div className="text-sm text-green-700 font-medium">Total Samples</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {reportData?.sampleAnalysis.completionRate || 0}%
              </div>
              <div className="text-sm text-blue-700 font-medium">Sample Completion Rate</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {reportData?.sampleAnalysis.avgSamplesPerSession || 0}
              </div>
              <div className="text-sm text-purple-700 font-medium">Avg Samples per Session</div>
            </div>
          </div>
        </div>

        {/* Student Performance */}
        <div className="glass-card p-6 mt-8">
          <div className="flex items-center space-x-3 mb-6">
            <Users className="w-6 h-6 text-slate-600" />
            <h2 className="text-xl font-bold text-slate-800">Student Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-800">Student</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-800">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-800">Completed</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-800">Cancelled</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-800">No-Shows</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-800">Success Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportData?.studentPerformance.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-800">{row.student} <span className="text-slate-500 text-xs">({row.email})</span></td>
                    <td className="px-6 py-4 text-slate-700">{row.total}</td>
                    <td className="px-6 py-4 text-green-600 font-medium">{row.completed}</td>
                    <td className="px-6 py-4 text-red-600 font-medium">{row.cancelled}</td>
                    <td className="px-6 py-4 text-orange-600 font-medium">{row.noShows}</td>
                    <td className="px-6 py-4 text-purple-600 font-medium">{row.successRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 