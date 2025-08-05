import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  try {
    // Log all parameters for debugging
    console.log('=== Direct Google OAuth Callback ===')
    console.log('Full URL:', requestUrl.toString())
    console.log('All search params:', Object.fromEntries(requestUrl.searchParams.entries()))
    
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const state = requestUrl.searchParams.get('state')
    
    console.log('OAuth Parameters found:')
    console.log('- code:', code ? 'Present' : 'Missing')
    console.log('- error:', error)
    console.log('- state:', state ? 'Present' : 'Missing')

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(error)}`)
    }

    if (!code) {
      console.log('No authorization code found')
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent('No authorization code received')}`)
    }

    // Exchange code for tokens using Google's token endpoint
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${requestUrl.origin}/auth/callback`

    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials not configured')
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent('OAuth not configured')}`)
    }

    console.log('Exchanging code for tokens...')
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      console.error('Token exchange error:', tokenData)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent('Token exchange failed')}`)
    }

    console.log('Tokens received successfully')

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    const userInfo = await userInfoResponse.json()
    
    if (!userInfoResponse.ok) {
      console.error('User info error:', userInfo)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent('Failed to get user info')}`)
    }

    console.log('User info received:', userInfo.email)

    // Create or get user in our database
    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', userInfo.email)
        .single()

      if (fetchError && fetchError.code === 'PGRST116') {
        // User doesn't exist, create them
        console.log('Creating new user...')
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email: userInfo.email,
            name: userInfo.name,
            role: 'student' // Default role
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating user:', createError)
          return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent('Failed to create user')}`)
        }

        console.log('User created successfully:', newUser)
      } else if (fetchError) {
        console.error('Error fetching user:', fetchError)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent('Failed to fetch user')}`)
      } else {
        console.log('User already exists:', existingUser)
      }
    } catch (error) {
      console.error('Database error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent('Database error')}`)
    }

    // Set session cookies
    const response = NextResponse.redirect(`${requestUrl.origin}`)
    
    // Store tokens in cookies
    response.cookies.set('google_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    if (tokenData.refresh_token) {
      response.cookies.set('google_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      })
    }

    return response

  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent('Authentication failed')}`)
  }
} 