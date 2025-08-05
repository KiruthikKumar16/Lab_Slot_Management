import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  try {
    // Log all parameters for debugging
    console.log('=== AUTH CALLBACK DEBUG ===')
    console.log('Full URL:', requestUrl.toString())
    console.log('All search params:', Object.fromEntries(requestUrl.searchParams.entries()))
    
    const code = requestUrl.searchParams.get('code')
    const accessToken = requestUrl.searchParams.get('access_token')
    const refreshToken = requestUrl.searchParams.get('refresh_token')
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')
    
    console.log('OAuth Parameters found:')
    console.log('- code:', code ? 'Present' : 'Missing')
    console.log('- access_token:', accessToken ? 'Present' : 'Missing')
    console.log('- refresh_token:', refreshToken ? 'Present' : 'Missing')
    console.log('- error:', error)

    if (error) {
      console.error('OAuth error:', error, errorDescription)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(error)}`)
    }

    const supabase = createRouteHandlerClient({ cookies })

    if (code) {
      console.log('Processing OAuth code...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Code exchange error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`)
      }

      if (data.session?.user) {
        console.log('Session established successfully for user:', data.session.user.email)
        // Let Supabase handle the session cookies automatically
        return NextResponse.redirect(`${requestUrl.origin}`)
      }
      
      console.log('No session in exchange response')
      return NextResponse.redirect(`${requestUrl.origin}`)
    } else if (accessToken && refreshToken) {
      console.log('Processing direct tokens...')
      const { data, error } = await supabase.auth.setSession({ 
        access_token: accessToken, 
        refresh_token: refreshToken 
      })
      
      if (error) {
        console.error('Set session error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`)
      }

      if (data.session?.user) {
        console.log('Session set successfully for user:', data.session.user.email)
        // Let Supabase handle the session cookies automatically
        return NextResponse.redirect(`${requestUrl.origin}`)
      }
      
      console.log('No session in set session response')
      return NextResponse.redirect(`${requestUrl.origin}`)
    } else {
      console.log('No tokens found, redirecting to home')
      return NextResponse.redirect(`${requestUrl.origin}`)
    }
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent('Authentication failed')}`)
  }
} 