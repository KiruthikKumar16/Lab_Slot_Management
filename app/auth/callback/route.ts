import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const accessToken = requestUrl.searchParams.get('access_token')
  const refreshToken = requestUrl.searchParams.get('refresh_token')

  const supabase = createRouteHandlerClient({ cookies })

  if (code) {
    // Handle OAuth code exchange
    await supabase.auth.exchangeCodeForSession(code)
  } else if (accessToken && refreshToken) {
    // Handle direct token exchange (for URL fragments)
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
} 