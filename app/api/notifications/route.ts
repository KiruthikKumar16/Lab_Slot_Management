import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('google_access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!userInfoResponse.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userInfo = await userInfoResponse.json()

    const { data: dbUser, error } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', userInfo.email)
      .single()
    if (error || !dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { data: items } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', dbUser.id)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ notifications: items || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('google_access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!userInfoResponse.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userInfo = await userInfoResponse.json()

    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', userInfo.email)
      .single()

    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { ids } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ success: true })

    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .in('id', ids)
      .eq('user_id', dbUser.id)

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


