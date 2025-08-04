'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AlertTriangle, X } from 'lucide-react'

interface SessionTimeoutProps {
  timeoutMinutes: number
  warningMinutes: number
}

export default function SessionTimeout({ timeoutMinutes = 30, warningMinutes = 5 }: SessionTimeoutProps) {
  const { user, signOut } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timeoutMinutes * 60)

  useEffect(() => {
    if (!user) return

    let lastActivity = Date.now()
    let timeoutId: NodeJS.Timeout

    const resetTimer = () => {
      lastActivity = Date.now()
      setTimeLeft(timeoutMinutes * 60)
      setShowWarning(false)
    }

    const handleActivity = () => {
      resetTimer()
    }

    // Activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Timer countdown
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivity) / 1000)
      const remaining = timeoutMinutes * 60 - elapsed
      
      setTimeLeft(remaining)

      if (remaining <= warningMinutes * 60 && remaining > 0) {
        setShowWarning(true)
      } else if (remaining <= 0) {
        signOut()
      }
    }, 1000)

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      clearInterval(timer)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [user, timeoutMinutes, warningMinutes, signOut])

  if (!user || !showWarning) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-orange-800">
              Session Expiring Soon
            </h3>
            <p className="text-sm text-orange-700 mt-1">
              Your session will expire in {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => setShowWarning(false)}
                className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded hover:bg-orange-200 transition-colors"
              >
                Stay Logged In
              </button>
              <button
                onClick={signOut}
                className="text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 transition-colors"
              >
                Sign Out Now
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowWarning(false)}
            className="text-orange-400 hover:text-orange-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
} 