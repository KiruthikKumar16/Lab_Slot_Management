import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  try {
    // Skip middleware for auth callback route
    if (req.nextUrl.pathname.startsWith('/auth/callback')) {
      console.log('Skipping middleware for auth callback')
      return res
    }

    console.log('Middleware processing:', req.nextUrl.pathname)

    // Check for Google OAuth session cookies
    const googleAccessToken = req.cookies.get('google_access_token')?.value
    const googleRefreshToken = req.cookies.get('google_refresh_token')?.value

    console.log('Google OAuth session check - Access token:', !!googleAccessToken, 'Refresh token:', !!googleRefreshToken)

    // If user is on login page but has valid Google OAuth tokens, redirect to appropriate page
    if (googleAccessToken && req.nextUrl.pathname === '/login') {
      console.log('User on login page with Google OAuth tokens, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // If user is not authenticated and trying to access protected routes
    if (!googleAccessToken && req.nextUrl.pathname !== '/login' && req.nextUrl.pathname !== '/') {
      console.log('No Google OAuth session found, redirecting to login')
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // If user has Google OAuth session and is trying to access protected routes, allow it
    if (googleAccessToken && req.nextUrl.pathname !== '/login' && req.nextUrl.pathname !== '/') {
      console.log('User has Google OAuth session, allowing access to:', req.nextUrl.pathname)
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