'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { User as AppUser } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
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
  const [user, setUser] = useState<User | null>(null)
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

  // Refresh session periodically to keep it alive
  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error refreshing session:', error)
        return
      }
      
      if (session) {
        console.log('Session refreshed successfully')
        // Update user state if needed
        if (!user || user.id !== session.user.id) {
          setUser(session.user)
          await fetchAppUser(session.user.id)
        }
      }
    } catch (error) {
      console.error('Error in session refresh:', error)
    }
  }

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
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
        console.log('Loading timeout reached, forcing loading to false')
        setLoading(false)
      }
    }, 10000) // 10 seconds timeout

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...')
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        }

        if (mounted) {
          setUser(session?.user ?? null)
          if (session?.user) {
            console.log('User found in session, fetching app user...')
            await fetchAppUser(session.user.id)
            resetInactivityTimer() // Start inactivity timer
            
            // Start session refresh interval (every 5 minutes)
            sessionRefreshIntervalRef.current = setInterval(refreshSession, 5 * 60 * 1000)
          } else {
            console.log('No user in session')
          }
          setLoading(false)
          console.log('Auth initialized, user:', session?.user?.email, 'loading:', false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes with better error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (mounted) {
          try {
            if (session?.user) {
              console.log('Setting user and fetching app user...')
              setUser(session.user)
              await fetchAppUser(session.user.id)
              resetInactivityTimer() // Reset timer on auth state change
              
              // Start session refresh interval
              if (sessionRefreshIntervalRef.current) {
                clearInterval(sessionRefreshIntervalRef.current)
              }
              sessionRefreshIntervalRef.current = setInterval(refreshSession, 5 * 60 * 1000)
            } else {
              console.log('Clearing user data...')
              setUser(null)
              setAppUser(null)
              if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current)
              }
              if (sessionRefreshIntervalRef.current) {
                clearInterval(sessionRefreshIntervalRef.current)
              }
            }
          } catch (error) {
            console.error('Error handling auth state change:', error)
            // Don't log out on error, just log it
          } finally {
            console.log('Setting loading to false')
            setLoading(false)
          }
        }
      }
    )

    // Set up activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, true)
    })

    // Check for activity every minute
    const activityCheckInterval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current
      if (timeSinceLastActivity > INACTIVITY_TIMEOUT * 60 * 1000 && user) {
        console.log('User inactive for too long, signing out...')
        handleSignOut()
      }
    }, 60000) // Check every minute

    return () => {
      mounted = false
      subscription.unsubscribe()
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
  }, [user])

  const fetchAppUser = async (userId: string) => {
    try {
      console.log('Fetching app user for:', userId)
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // If user doesn't exist in our app table, create them
        if (error.code === 'PGRST116') {
          console.log('User not found in app table, creating...')
          await createAppUser(userId)
        } else {
          console.error('Error fetching app user:', error)
          // Don't throw error, just log it to prevent logout
        }
        return
      }

      console.log('App user found:', data)
      setAppUser(data)
    } catch (error) {
      console.error('Error fetching app user:', error)
      // Don't throw error, just log it to prevent logout
    }
  }

  const createAppUser = async (userId: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser()
      if (!authUser.user) {
        console.error('No authenticated user found')
        return
      }

      console.log('Creating app user for:', authUser.user.email)
      console.log('User ID:', userId)

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: authUser.user.email,
          role: 'student' // Default role
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating app user:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        return
      }

      console.log('App user created successfully:', data)
      setAppUser(data)
    } catch (error) {
      console.error('Exception in createAppUser:', error)
    }
  }

  const signInWithGoogle = async () => {
    console.log('=== Direct Google OAuth ===')
    console.log('Window origin:', window.location.origin)
    
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
    
    console.log('Direct Google OAuth URL:', googleOAuthUrl)
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