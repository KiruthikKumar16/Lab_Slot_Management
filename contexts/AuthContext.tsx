'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User as AppUser } from '@/lib/supabase'

interface AuthContextType {
  user: any
  appUser: AppUser | null
  isAdmin: boolean
  loading: boolean
  signInWithGoogle: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const isAdmin = appUser?.role === 'admin'

  useEffect(() => {
    checkGoogleSession()
  }, [])

  const checkGoogleSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      
      if (data.user) {
        setUser(data.user)
        await fetchAppUser(data.user.email)
      } else {
        setUser(null)
        setAppUser(null)
      }
    } catch (error) {
      console.error('Session check error:', error)
      setUser(null)
      setAppUser(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchAppUser = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching app user:', error)
        return
      }

      if (data) {
        setAppUser(data)
      } else {
        // User doesn't exist in our database, create them
        await createAppUser(email)
      }
    } catch (error) {
      console.error('Error in fetchAppUser:', error)
    }
  }

  const createAppUser = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email,
            role: 'student' // Default role
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating app user:', error)
        return
      }

      setAppUser(data)
    } catch (error) {
      console.error('Error in createAppUser:', error)
    }
  }

  const signInWithGoogle = () => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!googleClientId) {
      console.error('Google OAuth not configured')
      return
    }

    const redirectUri = `${window.location.origin}/auth/callback`
    const scope = 'email profile'
    const responseType = 'code'
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=${responseType}&access_type=offline&prompt=consent`
    
    window.location.href = authUrl
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      setUser(null)
      setAppUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const value = {
    user,
    appUser,
    isAdmin,
    loading,
    signInWithGoogle,
    signOut: handleSignOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 