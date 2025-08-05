'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Search, Users, Calendar, Trash2, UserCheck, UserX } from 'lucide-react'
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
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-green-500 to-green-600',
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-orange-500 to-orange-600',
      'bg-gradient-to-br from-red-500 to-red-600',
      'bg-gradient-to-br from-indigo-500 to-indigo-600',
      'bg-gradient-to-br from-pink-500 to-pink-600',
      'bg-gradient-to-br from-teal-500 to-teal-600'
    ]
    const index = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-600 text-lg font-medium">Loading students...</p>
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
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            Student Management
          </h1>
          <p className="text-slate-600 text-lg">
            Manage and monitor all registered students
          </p>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-10">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-slate-800 text-lg shadow-sm hover:shadow-md transition-all duration-200"
            />
          </div>
          
          <div className="glass-card px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-800 mb-1">{students.length}</div>
              <div className="text-base text-slate-600 font-medium">Total Students</div>
              <div className="text-sm text-slate-500 mt-1 flex items-center justify-center gap-2">
                <UserCheck className="w-4 h-4 text-green-500" />
                {activeStudents} active
              </div>
            </div>
          </div>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredStudents.map((student) => (
            <div key={student.id} className="glass-card p-8 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
              {/* Student Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-5">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ${getAvatarColor(student.email)}`}>
                    {getInitials(student.email)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      {student.email.split('@')[0]}
                    </h3>
                    <p className="text-sm text-slate-600">{student.email}</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
                  student.isActive 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {student.isActive ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Active
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4" />
                      Inactive
                    </>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-5 mb-8">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-base text-slate-600 font-medium">Total Bookings</span>
                  <span className="text-xl font-bold text-slate-800">{student.totalBookings}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-base text-slate-600 font-medium">Completed</span>
                  <span className="text-xl font-bold text-green-600">{student.completedBookings}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-base text-slate-600 font-medium">Completion Rate</span>
                  <span className="text-xl font-bold text-blue-600">{student.completionRate}%</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-base text-slate-600 font-medium">Last active</span>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-600 font-medium">{student.lastActive}</span>
                  </div>
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemoveStudent(student.id)}
                disabled={removingStudent === student.id}
                className="w-full px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 text-base font-semibold shadow-lg hover:shadow-xl group-hover:bg-red-700"
              >
                {removingStudent === student.id ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-slate-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-slate-600 mb-3">No students found</h3>
            <p className="text-slate-500 text-lg">
              {searchTerm ? 'Try adjusting your search terms' : 'No students have registered yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 