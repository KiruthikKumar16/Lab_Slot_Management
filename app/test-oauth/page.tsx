'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Prevent static generation
export const dynamic = 'force-dynamic'

export default function TestOAuthPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState('')
  const [origin, setOrigin] = useState('')
  const [redirectUri, setRedirectUri] = useState('')
  const [oauthUrl, setOauthUrl] = useState('')

  useEffect(() => {
    // Set these values after component mounts (client-side only)
    setCurrentUrl(window.location.href)
    setOrigin(window.location.origin)
    setRedirectUri(`${window.location.origin}/auth/callback`)
  }, [])

  const testOAuth = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('=== OAuth Debug Info ===')
      console.log('Current origin:', window.location.origin)
      console.log('Redirect URI being sent:', `${window.location.origin}/auth/callback`)
      console.log('Full redirect URI:', `${window.location.origin}/auth/callback`)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (error) {
        console.error('OAuth error:', error)
        setError(error.message)
      } else {
        console.log('OAuth initiated successfully:', data)
        console.log('OAuth URL:', data.url)
        setOauthUrl(data.url)
        
        // Parse the OAuth URL to see what redirect_uri is being sent
        if (data.url) {
          const url = new URL(data.url)
          const redirectUriParam = url.searchParams.get('redirect_uri')
          console.log('Redirect URI in OAuth URL:', redirectUriParam)
        }
      }
    } catch (err) {
      console.error('Test OAuth error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
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
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Google OAuth'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {oauthUrl && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm font-semibold">OAuth URL Generated:</p>
              <p className="text-blue-600 text-xs break-all mt-2">{oauthUrl}</p>
            </div>
          )}

          <div className="mt-6 text-sm text-slate-600 space-y-2">
            <p>Current URL: {currentUrl || 'Loading...'}</p>
            <p>Origin: {origin || 'Loading...'}</p>
            <p>Redirect URI: {redirectUri || 'Loading...'}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 