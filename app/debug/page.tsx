'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [envInfo, setEnvInfo] = useState<any>({})
  const [supabaseInfo, setSupabaseInfo] = useState<any>({})

  useEffect(() => {
    // Check environment variables
    setEnvInfo({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: process.env.NODE_ENV,
      window_origin: window.location.origin,
      window_href: window.location.href
    })

    // Check Supabase configuration
    setSupabaseInfo({
      supabase_configured: !!supabase,
      has_auth: !!supabase.auth
    })
  }, [])

  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      console.log('Supabase connection test:', { data, error })
      alert(error ? `Error: ${error.message}` : 'Supabase connection successful!')
    } catch (err) {
      console.error('Supabase test error:', err)
      alert(`Error: ${err}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="glass-card p-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">Debug Information</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-700 mb-2">Environment Variables</h2>
              <div className="bg-slate-50 p-4 rounded-lg">
                <pre className="text-sm text-slate-600 whitespace-pre-wrap">
                  {JSON.stringify(envInfo, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-700 mb-2">Supabase Configuration</h2>
              <div className="bg-slate-50 p-4 rounded-lg">
                <pre className="text-sm text-slate-600 whitespace-pre-wrap">
                  {JSON.stringify(supabaseInfo, null, 2)}
                </pre>
              </div>
            </div>

            <button
              onClick={testSupabaseConnection}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300"
            >
              Test Supabase Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 