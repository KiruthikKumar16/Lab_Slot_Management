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

    // Refresh session if expired - required for Server Components
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Middleware session error:', error)
    }

    console.log('Session found:', !!session, 'User:', session?.user?.email)

    // If user is on login page but has a valid session, redirect to appropriate page
    if (session && req.nextUrl.pathname === '/login') {
      const user = session.user
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
    if (!session && req.nextUrl.pathname !== '/login' && req.nextUrl.pathname !== '/') {
      console.log('No session found, redirecting to login')
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // If user has session and is trying to access protected routes, allow it
    if (session && req.nextUrl.pathname !== '/login' && req.nextUrl.pathname !== '/') {
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