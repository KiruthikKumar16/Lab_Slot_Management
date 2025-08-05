'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic' // Prevent static generation

export default function TestOAuthPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState('')
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setCurrentUrl(window.location.href)
    setOrigin(window.location.origin)
  }, [])

  const testOAuth = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('=== Simple OAuth Test ===')
      console.log('Current origin:', window.location.origin)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('OAuth error:', error)
        setError(error.message)
      } else {
        console.log('OAuth URL generated:', data.url)
        // Redirect to the OAuth URL
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Test OAuth error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const checkSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      console.log('Current session:', data.session)
      console.log('Session error:', error)
      alert(data.session ? `Session found for: ${data.session.user.email}` : 'No session found')
    } catch (err) {
      console.error('Session check error:', err)
      alert('Error checking session')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">OAuth Test Page</h1>
          
          <button
            onClick={testOAuth}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 mb-4"
          >
            {loading ? 'Testing...' : 'Test Google OAuth'}
          </button>

          <button
            onClick={checkSession}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-all duration-300 mb-4"
          >
            Check Current Session
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="mt-6 text-sm text-slate-600 space-y-2">
            <p>Current URL: {currentUrl || 'Loading...'}</p>
            <p>Origin: {origin || 'Loading...'}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 