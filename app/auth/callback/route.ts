import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  
  try {
    // Log all search parameters for debugging
    console.log('=== AUTH CALLBACK DEBUG ===')
    console.log('Full URL:', requestUrl.toString())
    console.log('All search params:', Object.fromEntries(requestUrl.searchParams.entries()))
    console.log('Headers:', Object.fromEntries(request.headers.entries()))
    
    const code = requestUrl.searchParams.get('code')
    const accessToken = requestUrl.searchParams.get('access_token')
    const refreshToken = requestUrl.searchParams.get('refresh_token')
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')

    // If there's an OAuth error, redirect to login with error
    if (error) {
      console.error('OAuth error:', error, errorDescription)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_${error}`)
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Try to exchange code for session
    if (code) {
      console.log('Attempting to exchange code for session...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code:', error)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
      }
      
      console.log('Code exchanged successfully')
      console.log('Session user:', data.session?.user?.email)
      
      if (data.session?.user) {
        // Redirect to home page and let it handle the routing
        console.log('Redirecting to home page...')
        return NextResponse.redirect(`${requestUrl.origin}`)
      }
    }

    // If no code or session exchange failed, redirect to home
    console.log('No valid authentication found, redirecting to home...')
    return NextResponse.redirect(`${requestUrl.origin}`)
    
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=unknown`)
  }
} 