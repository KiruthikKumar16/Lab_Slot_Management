'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, FileText, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Booking, LabSlot } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navigation from '@/components/Navigation'

interface SessionWithSlot extends Booking {
  lab_slot: LabSlot
}

export default function SubmitSamplesPage({ params }: { params: { bookingId: string } }) {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [session, setSession] = useState<SessionWithSlot | null>(null)
  const [samplesCount, setSamplesCount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (isAdmin) {
      router.push('/admin')
      return
    }

    fetchSession()
  }, [user, isAdmin, router, params.bookingId])

  const fetchSession = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/bookings?booking_id=${encodeURIComponent(params.bookingId)}`)
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || 'Failed to load session')
      const items = payload?.bookings || []
      const record = Array.isArray(items) ? items[0] : items
      if (!record) {
        toast.error('Session not found')
        router.push('/my-sessions')
        return
      }
      setSession(record)
    } catch (error) {
      console.error('Error fetching session:', error)
      toast.error('Failed to load session')
      router.push('/my-sessions')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!samplesCount || parseInt(samplesCount) < 0) {
      toast.error('Please enter a valid number of samples')
      return
    }

    if (!session) return

    // Check if session is completed
    const sessionDate = new Date(session.lab_slot.date)
    const sessionEndTime = new Date(`${session.lab_slot.date}T${session.lab_slot.end_time}`)
    const now = new Date()

    if (now < sessionEndTime) {
      toast.error('Cannot submit samples before session ends')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/samples/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: session.id,
          samples_count: parseInt(samplesCount),
          remarks
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit samples')
      }

      toast.success('Samples submitted successfully!')
      router.push('/my-sessions')
    } catch (error) {
      console.error('Error submitting samples:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit samples')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const sessionDate = new Date(session.lab_slot.date)
  const sessionEndTime = new Date(`${session.lab_slot.date}T${session.lab_slot.end_time}`)
  const now = new Date()
  const canSubmit = now >= sessionEndTime && session.status === 'booked' && !session.samples_count

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation currentPage="my-sessions" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Submit Samples
          </h1>
          <p className="text-slate-600 text-lg">Submit your sample count for the completed session</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Session Details */}
          <div className="glass-card p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Session Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-slate-500" />
                <span className="text-slate-700">
                  {sessionDate.toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-slate-500" />
                <span className="text-slate-700">
                  {session.lab_slot.start_time} - {session.lab_slot.end_time}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-slate-500" />
                <span className="text-slate-700">Lab Session</span>
              </div>

              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-slate-500" />
                <span className="text-slate-700">Status: {session.status}</span>
              </div>
            </div>

            {session.samples_count && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    Samples already submitted: {session.samples_count}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Submit Form */}
          <div className="glass-card p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Submit Samples</h2>
            
            {!canSubmit ? (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-800">
                    {session.samples_count 
                      ? 'Samples have already been submitted for this session.'
                                      : session.status !== 'booked'
                ? 'Session must be booked before submitting samples.'
                      : now < sessionEndTime
                      ? 'Cannot submit samples before session ends.'
                      : 'Unable to submit samples at this time.'
                    }
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Number of Samples
                  </label>
                  <input
                    type="number"
                    value={samplesCount}
                    onChange={(e) => setSamplesCount(e.target.value)}
                    min="0"
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-slate-800"
                    placeholder="Enter number of samples"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-slate-800"
                    placeholder="Add any additional notes about your samples..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    'Submit Samples'
                  )}
                </button>
              </form>
            )}

            <button
              onClick={() => router.push('/my-sessions')}
              className="w-full mt-4 px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
            >
              ← Back to My Sessions
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 