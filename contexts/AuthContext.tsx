'use client'

import { createContext, useContext, useEffect, useState } from 'react'
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

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
            await fetchAppUser(session.user.id)
          }
          setLoading(false)
          console.log('Auth initialized, user:', session?.user?.email)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (mounted) {
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchAppUser(session.user.id)
          } else {
            setAppUser(null)
          }
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

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
        }
        return
      }

      console.log('App user found:', data)
      setAppUser(data)
    } catch (error) {
      console.error('Error fetching app user:', error)
    }
  }

  const createAppUser = async (userId: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser()
      if (!authUser.user) return

      console.log('Creating app user for:', authUser.user.email)

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
        return
      }

      console.log('App user created:', data)
      setAppUser(data)
    } catch (error) {
      console.error('Error creating app user:', error)
    }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
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