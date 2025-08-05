'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { User as AppUser } from '@/lib/supabase'

interface AuthContextType {
  user: any | null
  appUser: AppUser | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Inactivity timeout in minutes
const INACTIVITY_TIMEOUT = 30 // 30 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const sessionRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    lastActivityRef.current = Date.now()
    
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    
    inactivityTimerRef.current = setTimeout(() => {
      console.log('User inactive for 30 minutes, signing out...')
      handleSignOut()
    }, INACTIVITY_TIMEOUT * 60 * 1000)
  }

  // Handle user activity
  const handleUserActivity = () => {
    if (user) {
      resetInactivityTimer()
    }
  }

  // Check Google OAuth session
  const checkGoogleSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      
      if (data.user) {
        setUser(data.user)
        await fetchAppUser(data.user.email)
        resetInactivityTimer()
      } else {
        setUser(null)
        setAppUser(null)
      }
    } catch (error) {
      console.error('Error checking session:', error)
      setUser(null)
      setAppUser(null)
    }
  }

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      setUser(null)
      setAppUser(null)
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      if (sessionRefreshIntervalRef.current) {
        clearInterval(sessionRefreshIntervalRef.current)
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  useEffect(() => {
    let mounted = true

    // Add a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false)
      }
    }, 10000) // 10 seconds timeout

    const initializeAuth = async () => {
      try {
        await checkGoogleSession()
        
        if (mounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Set up activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, true)
    })

    // Check for activity every minute
    const activityCheckInterval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current
      if (timeSinceLastActivity > INACTIVITY_TIMEOUT * 60 * 1000 && user) {
        handleSignOut()
      }
    }, 60000) // Check every minute

    return () => {
      mounted = false
      clearTimeout(loadingTimeout)
      
      // Clean up activity listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true)
      })
      
      // Clean up intervals
      clearInterval(activityCheckInterval)
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      if (sessionRefreshIntervalRef.current) {
        clearInterval(sessionRefreshIntervalRef.current)
      }
    }
  }, [])

    const fetchAppUser = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        // If user doesn't exist in our app table, create them
        if (error.code === 'PGRST116') {
          await createAppUser(email)
        } else {
          console.error('Error fetching app user:', error)
        }
        return
      }

      setAppUser(data)
    } catch (error) {
      console.error('Error fetching app user:', error)
    }
  }

  const createAppUser = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: email,
          role: 'student' // Default role
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating app user:', error)
        return
      }

      setAppUser(data)
    } catch (error) {
      console.error('Exception in createAppUser:', error)
    }
  }

  const signInWithGoogle = async () => {
    // Direct Google OAuth implementation
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      console.error('Google Client ID not configured')
      throw new Error('Google OAuth not configured')
    }
    
    const redirectUri = `${window.location.origin}/auth/callback`
    const scope = 'email profile'
    const responseType = 'code'
    
    const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`
    
    window.location.href = googleOAuthUrl
  }

  const signOut = async () => {
    await handleSignOut()
  }

  const isAdmin = appUser?.role === 'admin'

  return (
    <AuthContext.Provider value={{ 
      user, 
      appUser, 
      loading, 
      signInWithGoogle,
      signOut, 
      isAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 