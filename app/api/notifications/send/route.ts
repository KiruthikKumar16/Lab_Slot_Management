import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('google_access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { to_user_id, title, message } = await request.json()
    if (!to_user_id || !title || !message) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('notifications')
      .insert({ user_id: to_user_id, title, message, is_read: false })

    if (error) return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


