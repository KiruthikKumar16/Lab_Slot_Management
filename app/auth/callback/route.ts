import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  
  try {
    const code = requestUrl.searchParams.get('code')
    const accessToken = requestUrl.searchParams.get('access_token')
    const refreshToken = requestUrl.searchParams.get('refresh_token')
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')

    console.log('Auth callback route - URL:', requestUrl.toString())
    console.log('Code:', !!code)
    console.log('Access token:', !!accessToken)
    console.log('Refresh token:', !!refreshToken)
    console.log('Error:', error)
    console.log('Error description:', errorDescription)

    // If there's an OAuth error, redirect to login with error
    if (error) {
      console.error('OAuth error:', error, errorDescription)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_${error}`)
    }

    const supabase = createRouteHandlerClient({ cookies })

    if (code) {
      console.log('Exchanging code for session...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code:', error)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
      }
      
      console.log('Code exchanged successfully')
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    } else if (accessToken && refreshToken) {
      console.log('Setting session with tokens...')
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
      
      if (error) {
        console.error('Error setting session:', error)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
      }
      
      console.log('Session set successfully')
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    } else {
      console.log('No authentication tokens found - this might be a direct visit to the callback URL')
      // Instead of redirecting to login with error, redirect to home page
      // which will handle the authentication state properly
      return NextResponse.redirect(`${requestUrl.origin}`)
    }
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=unknown`)
  }
} 