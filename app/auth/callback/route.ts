import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(new URL('/login?error=oauth_error', request.url))
    }

    if (!code) {
      console.error('No authorization code received')
      return NextResponse.redirect(new URL('/login?error=no_code', request.url))
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${request.nextUrl.origin}/auth/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text())
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url))
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token } = tokenData

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info:', await userInfoResponse.text())
      return NextResponse.redirect(new URL('/login?error=user_info_failed', request.url))
    }

    const userInfo = await userInfoResponse.json()

    // Check if user exists in our database
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userInfo.email)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking user:', userError)
      return NextResponse.redirect(new URL('/login?error=database_error', request.url))
    }

    let userId: string

    if (existingUser) {
      userId = existingUser.id
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            email: userInfo.email,
            role: 'student', // Default role
          },
        ])
        .select()
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.redirect(new URL('/login?error=create_user_failed', request.url))
      }

      userId = newUser.id
    }

    // Set cookies
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.set('google_access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
    })

    if (refresh_token) {
      response.cookies.set('google_refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      })
    }

    return response

  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=callback_error', request.url))
  }
} 