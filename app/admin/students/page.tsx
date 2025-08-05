'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Search, Users, Calendar, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navigation from '@/components/Navigation'

interface Student {
  id: string
  email: string
  role: string
  created_at: string
  totalBookings: number
  completedBookings: number
  completionRate: number
  lastActive: string
  isActive: boolean
}

export default function AdminStudents() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [removingStudent, setRemovingStudent] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!isAdmin) {
      router.push('/dashboard')
      return
    }

    fetchStudents()
  }, [user, isAdmin, router])

  useEffect(() => {
    const filtered = students.filter(student =>
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.split('@')[0].toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredStudents(filtered)
  }, [searchTerm, students])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      
      // Fetch all students
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      // Fetch booking data for each student
      const studentsWithStats = await Promise.all(
        (users || []).map(async (user) => {
          const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', user.id)

          if (bookingsError) throw bookingsError

          const totalBookings = bookings?.length || 0
          const completedBookings = bookings?.filter(b => b.status === 'booked').length || 0
          const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0
          
          // Calculate last active date
          const lastBooking = bookings?.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
          
          const lastActive = lastBooking ? new Date(lastBooking.created_at).toISOString().split('T')[0] : 'Never'
          const isActive = lastBooking ? 
            (new Date().getTime() - new Date(lastBooking.created_at).getTime()) < (30 * 24 * 60 * 60 * 1000) : false

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            totalBookings,
            completedBookings,
            completionRate,
            lastActive,
            isActive
          }
        })
      )

      setStudents(studentsWithStats)
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    try {
      setRemovingStudent(studentId)
      
      // First, delete all bookings for this student
      const { error: bookingsError } = await supabase
        .from('bookings')
        .delete()
        .eq('user_id', studentId)

      if (bookingsError) throw bookingsError

      // Then delete the user
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', studentId)

      if (userError) throw userError

      // Remove from local state
      setStudents(prev => prev.filter(s => s.id !== studentId))
      toast.success('Student removed successfully')
    } catch (error) {
      console.error('Error removing student:', error)
      toast.error('Failed to remove student')
    } finally {
      setRemovingStudent(null)
    }
  }

  const getInitials = (email: string) => {
    const name = email.split('@')[0]
    const words = name.split(/[._-]/)
    return words.map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2)
  }

  const getAvatarColor = (email: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 
      'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
    ]
    const index = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading students...</p>
        </div>
      </div>
    )
  }

  const activeStudents = students.filter(s => s.isActive).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation currentPage="students" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Student Management
          </h1>
          <p className="text-slate-600">
            Manage and monitor all registered students
          </p>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
            />
          </div>
          
          <div className="glass-card px-6 py-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{students.length}</div>
              <div className="text-sm text-slate-600">Total Students</div>
              <div className="text-xs text-slate-500">{activeStudents} active</div>
            </div>
          </div>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredStudents.map((student) => (
            <div key={student.id} className="glass-card p-8">
              {/* Student Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg ${getAvatarColor(student.email)}`}>
                    {getInitials(student.email)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                      {student.email.split('@')[0]}
                    </h3>
                    <p className="text-sm text-slate-600">{student.email}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  student.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {student.isActive ? 'active' : 'inactive'}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-base text-slate-600">Total Bookings</span>
                  <span className="text-lg font-semibold text-slate-800">{student.totalBookings}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-base text-slate-600">Completed</span>
                  <span className="text-lg font-semibold text-green-600">{student.completedBookings}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-base text-slate-600">Completion Rate</span>
                  <span className="text-lg font-semibold text-blue-600">{student.completionRate}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-base text-slate-600">Last active</span>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{student.lastActive}</span>
                  </div>
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemoveStudent(student.id)}
                disabled={removingStudent === student.id}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-3 disabled:opacity-50 text-base font-medium"
              >
                {removingStudent === student.id ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    <span>Remove Student</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredStudents.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No students found</h3>
            <p className="text-slate-500">
              {searchTerm ? 'Try adjusting your search terms' : 'No students have registered yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 