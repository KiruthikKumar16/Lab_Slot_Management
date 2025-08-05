import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true })
    
    // Clear Google OAuth cookies
    response.cookies.delete('google_access_token')
    response.cookies.delete('google_refresh_token')
    
    return response
  } catch (error) {
    console.error('Sign out error:', error)
    return NextResponse.json({ success: false, error: 'Sign out failed' })
  }
} 