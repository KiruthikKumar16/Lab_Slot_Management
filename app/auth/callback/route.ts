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
      console.log('Session user:', data.session?.user?.email)
      
      // Check user role and redirect accordingly
      if (data.session?.user) {
        try {
          const { data: appUser, error: appUserError } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.session.user.id)
            .single()
          
          if (appUserError) {
            console.error('Error fetching app user:', appUserError)
            // If user doesn't exist, create them
            if (appUserError.code === 'PGRST116') {
              console.log('Creating new app user...')
              const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                  id: data.session.user.id,
                  email: data.session.user.email,
                  role: 'student'
                })
                .select()
                .single()
              
              if (createError) {
                console.error('Error creating app user:', createError)
                // Continue anyway, user will be created by AuthContext
              } else {
                console.log('App user created successfully')
              }
            }
          }
          
          const redirectUrl = appUser?.role === 'admin' ? '/admin' : '/dashboard'
          console.log('Redirecting to:', redirectUrl)
          return NextResponse.redirect(`${requestUrl.origin}${redirectUrl}`)
        } catch (error) {
          console.error('Error in role check:', error)
          // Fallback to dashboard
          return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
        }
      }
      
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
      console.log('Session user:', data.session?.user?.email)
      
      // Check user role and redirect accordingly
      if (data.session?.user) {
        try {
          const { data: appUser, error: appUserError } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.session.user.id)
            .single()
          
          if (appUserError) {
            console.error('Error fetching app user:', appUserError)
            // If user doesn't exist, create them
            if (appUserError.code === 'PGRST116') {
              console.log('Creating new app user...')
              const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                  id: data.session.user.id,
                  email: data.session.user.email,
                  role: 'student'
                })
                .select()
                .single()
              
              if (createError) {
                console.error('Error creating app user:', createError)
                // Continue anyway, user will be created by AuthContext
              } else {
                console.log('App user created successfully')
              }
            }
          }
          
          const redirectUrl = appUser?.role === 'admin' ? '/admin' : '/dashboard'
          console.log('Redirecting to:', redirectUrl)
          return NextResponse.redirect(`${requestUrl.origin}${redirectUrl}`)
        } catch (error) {
          console.error('Error in role check:', error)
          // Fallback to dashboard
          return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
        }
      }
      
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