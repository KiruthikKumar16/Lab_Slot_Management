import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('=== SESSION API DEBUG ===')
    const cookieStore = cookies()
    const accessToken = cookieStore.get('google_access_token')?.value
    const refreshToken = cookieStore.get('google_refresh_token')?.value

    console.log('Cookies found:')
    console.log('- google_access_token:', accessToken ? 'Present' : 'Missing')
    console.log('- google_refresh_token:', refreshToken ? 'Present' : 'Missing')

    if (!accessToken) {
      console.log('No access token found, returning null user')
      return NextResponse.json({ user: null })
    }

    console.log('Verifying token with Google...')
    // Verify the token with Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    console.log('Google response status:', userInfoResponse.status)

    if (!userInfoResponse.ok) {
      console.log('Token is invalid, clearing cookies')
      // Token is invalid, clear cookies
      const response = NextResponse.json({ user: null })
      response.cookies.delete('google_access_token')
      response.cookies.delete('google_refresh_token')
      return response
    }

    const userInfo = await userInfoResponse.json()
    console.log('User info received:', userInfo.email)
    
    return NextResponse.json({
      user: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      }
    })

  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ user: null })
  }
} 