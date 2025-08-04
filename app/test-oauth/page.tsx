'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestOAuthPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testOAuth = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Testing OAuth configuration...')
      console.log('Current origin:', window.location.origin)
      
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

          <div className="mt-6 text-sm text-slate-600">
            <p>Current URL: {window.location.href}</p>
            <p>Origin: {window.location.origin}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 