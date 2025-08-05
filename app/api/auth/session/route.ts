import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('google_access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ user: null })
    }

    // Verify the token with Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!userInfoResponse.ok) {
      // Token is invalid, clear cookies
      const response = NextResponse.json({ user: null })
      response.cookies.delete('google_access_token')
      response.cookies.delete('google_refresh_token')
      return response
    }

    const userInfo = await userInfoResponse.json()
    
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