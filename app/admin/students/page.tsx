'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Users, Search, User, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { User as AppUser } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navigation from '@/components/Navigation'

export default function AdminStudents() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

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

  const fetchStudents = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false })

      if (error) throw error

      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student =>
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation currentPage="students" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Student Management
          </h1>
          <p className="text-slate-600 text-lg">View and manage student accounts</p>
        </div>

        {/* Search */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center space-x-3">
            <Search className="w-5 h-5 text-slate-600" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Students List */}
        <div className="space-y-4">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div key={student.id} className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">
                          {student.email}
                        </div>
                        <div className="text-sm text-slate-600">
                          Student ID: {student.id}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Joined: {new Date(student.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>Role: {student.role}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Students Found</h3>
              <p className="text-slate-600">
                {searchTerm ? 'No students match your search.' : 'No students have registered yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-8">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Student Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{students.length}</div>
                <div className="text-sm text-slate-600">Total Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {students.filter(s => new Date(s.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                </div>
                <div className="text-sm text-slate-600">New This Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {students.filter(s => new Date(s.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                </div>
                <div className="text-sm text-slate-600">New This Month</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 