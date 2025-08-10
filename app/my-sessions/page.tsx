'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, MapPin, AlertTriangle, CheckCircle, XCircle, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Booking, LabSlot } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navigation from '@/components/Navigation'

interface SessionWithSlot extends Booking {
  lab_slot: LabSlot
}

export default function MySessionsPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionWithSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [pendingCancel, setPendingCancel] = useState<{ id: number; date: string } | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (isAdmin) {
      router.push('/admin')
      return
    }

    fetchSessions()
  }, [user, isAdmin, router])

  const fetchSessions = async () => {
    try {
      setLoading(true)

      const res = await fetch('/api/bookings', { method: 'GET' })
      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg = payload?.error || 'Failed to load sessions'
        throw new Error(msg)
      }

      setSessions((payload?.bookings || []) as SessionWithSlot[])
    } catch (error) {
      console.error('Error fetching sessions:', error)
      toast.error('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  const openCancelModal = (bookingId: number, sessionDate: string) => {
    const today = new Date()
    const sessionDateObj = new Date(sessionDate)
    const daysUntilSession = Math.ceil((sessionDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntilSession < 1) {
      toast.error('Cancellations must be made at least 1 day in advance')
      return
    }
    setPendingCancel({ id: bookingId, date: sessionDate })
    setCancelReason('')
    setConfirmText('')
    setShowCancelModal(true)
  }

  const submitCancel = async () => {
    if (!pendingCancel) return
    if (!cancelReason.trim()) {
      toast.error('Please provide a brief reason')
      return
    }
    if (confirmText.trim().toLowerCase() !== 'delete') {
      toast.error("Type 'DELETE' to confirm cancellation")
      return
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: pendingCancel.id, status: 'cancelled' })
      })
      if (!response.ok) throw new Error('Failed to cancel booking')
      toast.success('Booking cancelled successfully')
      setShowCancelModal(false)
      setPendingCancel(null)
      fetchSessions()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error('Failed to cancel booking')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'no-show':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />
      default:
        return <Clock className="w-5 h-5 text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'no-show':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation currentPage="my-sessions" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            My Sessions
          </h1>
          <p className="text-slate-600 text-lg">View and manage your lab sessions</p>
        </div>

        {/* Sessions List */}
        <div className="space-y-6">
          {sessions.length > 0 ? (
            sessions.map((session) => {
              const sessionDate = new Date(session.lab_slot.date)
              const today = new Date()
              const daysUntilSession = Math.ceil((sessionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              const canCancel = daysUntilSession >= 1 && session.status === 'booked'
              const canSubmitSamples = session.status === 'booked' && !session.samples_count

              return (
                <div key={session.id} className="glass-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(session.status)}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          Lab Session
                        </h3>
                        <p className="text-sm text-slate-600">
                          {session.lab_slot.date} • {session.lab_slot.start_time} - {session.lab_slot.end_time}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-700">
                        {new Date(session.lab_slot.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-700">
                        {session.lab_slot.start_time} - {session.lab_slot.end_time}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-700">Lab Room</span>
                    </div>
                  </div>

                  {session.samples_count && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-green-800 font-medium">
                          Samples submitted: {session.samples_count}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    {canCancel && (
                      <button
                        onClick={() => openCancelModal(session.id, session.lab_slot.date)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                      >
                        Cancel Session
                      </button>
                    )}
                    
                    {canSubmitSamples && (
                      <button
                        onClick={() => router.push(`/submit-samples/${session.id}`)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        Submit Samples
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Sessions Found</h3>
              <p className="text-slate-600 mb-6">You haven't booked any lab sessions yet.</p>
              <button
                onClick={() => router.push('/book')}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300"
              >
                Book Your First Session
              </button>
            </div>
          )}
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Cancel Booking</h3>
            <p className="text-slate-600 mb-3">Please provide a brief reason for cancelling this booking.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              placeholder="e.g., schedule conflict, feeling unwell, other"
            />
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type <span className="font-semibold">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                placeholder="DELETE"
              />
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowCancelModal(false); setPendingCancel(null) }}
                className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-800"
              >
                Keep Booking
              </button>
              <button
                onClick={submitCancel}
                disabled={!cancelReason.trim() || confirmText.trim().toLowerCase() !== 'delete'}
                className={`px-4 py-2 rounded-lg text-white ${(!cancelReason.trim() || confirmText.trim().toLowerCase() !== 'delete') ? 'bg-red-400 cursor-not-allowed opacity-60' : 'bg-red-600 hover:bg-red-700'}`}
              >
                Cancel Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 