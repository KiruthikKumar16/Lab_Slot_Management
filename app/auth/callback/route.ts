import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const accessToken = requestUrl.searchParams.get('access_token')
    const refreshToken = requestUrl.searchParams.get('refresh_token')

    console.log('Auth callback route - URL:', requestUrl.toString())
    console.log('Code:', !!code)
    console.log('Access token:', !!accessToken)
    console.log('Refresh token:', !!refreshToken)

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
      console.log('No authentication tokens found')
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_tokens`)
    }
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=unknown`)
  }
} 