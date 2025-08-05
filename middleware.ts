import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Skip middleware for auth callback route
    if (req.nextUrl.pathname.startsWith('/auth/callback')) {
      console.log('Skipping middleware for auth callback')
      return res
    }

    console.log('Middleware processing:', req.nextUrl.pathname)

    // TEMPORARY: Skip middleware for dashboard to test if session detection is the issue
    if (req.nextUrl.pathname === '/dashboard') {
      console.log('Temporarily allowing dashboard access to test session detection')
      return res
    }

    // Try to refresh the session first
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Middleware session error:', error)
    }

    // If no session found, try to refresh it
    if (!session) {
      console.log('No session found, attempting to refresh...')
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('Session refresh error:', refreshError)
      } else if (refreshedSession) {
        console.log('Session refreshed successfully')
      }
    }

    const currentSession = session || (await supabase.auth.getSession()).data.session
    console.log('Final session check - Session found:', !!currentSession, 'User:', currentSession?.user?.email)

    // If user is on login page but has a valid session, redirect to appropriate page
    if (currentSession && req.nextUrl.pathname === '/login') {
      const user = currentSession.user
      console.log('User on login page with session, checking app database...')
      
      // Check if user exists in our app database
      const { data: appUser, error: appUserError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      // If user exists in app database, redirect based on role
      if (appUser && !appUserError) {
        const redirectUrl = appUser.role === 'admin' ? '/admin' : '/dashboard'
        console.log('Redirecting authenticated user to:', redirectUrl)
        return NextResponse.redirect(new URL(redirectUrl, req.url))
      }
      
      // If user doesn't exist in app database yet, let the app handle it
      // (the AuthContext will create the user)
      console.log('User authenticated but not in app database yet, letting app handle it')
    }

    // If user is not authenticated and trying to access protected routes
    if (!currentSession && req.nextUrl.pathname !== '/login' && req.nextUrl.pathname !== '/') {
      console.log('No session found, redirecting to login')
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // If user has session and is trying to access protected routes, allow it
    if (currentSession && req.nextUrl.pathname !== '/login' && req.nextUrl.pathname !== '/') {
      console.log('User has session, allowing access to:', req.nextUrl.pathname)
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth/callback (OAuth callback route)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 