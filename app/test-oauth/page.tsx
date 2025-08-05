'use client'

import { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic' // Prevent static generation

export default function TestOAuthPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState('')
  const [origin, setOrigin] = useState('')
  const [credentialsStatus, setCredentialsStatus] = useState<string>('')

  useEffect(() => {
    setCurrentUrl(window.location.href)
    setOrigin(window.location.origin)
    
    // Check if Google OAuth credentials are configured
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    
    if (!clientId) {
      setCredentialsStatus('❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID not configured')
    } else if (!clientSecret) {
      setCredentialsStatus('❌ GOOGLE_CLIENT_SECRET not configured')
    } else {
      setCredentialsStatus('✅ Google OAuth credentials configured')
    }
  }, [])

  const testOAuth = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('=== Direct Google OAuth Test ===')
      console.log('Current origin:', window.location.origin)
      
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!clientId) {
        throw new Error('Google Client ID not configured')
      }
      
      const redirectUri = `${window.location.origin}/auth/callback`
      const scope = 'email profile'
      const responseType = 'code'
      
      const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`
      
      console.log('Direct Google OAuth URL:', googleOAuthUrl)
      window.location.href = googleOAuthUrl
    } catch (err) {
      console.error('Test OAuth error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      console.log('Current session:', data)
      alert(data.user ? `Session found for: ${data.user.email}` : 'No session found')
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
          
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-semibold text-slate-700">Credentials Status:</p>
            <p className="text-sm text-slate-600">{credentialsStatus}</p>
          </div>
          
          <button
            onClick={testOAuth}
            disabled={loading || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
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
            <p>Client ID: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not set'}</p>
            <p>Client Secret: {process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Not set'}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 