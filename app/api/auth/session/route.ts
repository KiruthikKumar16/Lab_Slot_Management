import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  console.log('=== SESSION API CALLED ===')
  console.log('Request URL:', request.url)
  
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('google_access_token')?.value

    console.log('Access token found:', !!accessToken)

    if (!accessToken) {
      console.log('No access token found, returning null user')
      const response = NextResponse.json({ user: null })
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
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
    
    const response = NextResponse.json({
      user: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      }
    })
    
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response

  } catch (error) {
    console.error('Session check error:', error)
    const response = NextResponse.json({ user: null })
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  }
} 