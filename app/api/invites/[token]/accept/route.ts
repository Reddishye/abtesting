import { type NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const { data: invite } = await adminClient
    .from('invites')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (!invite) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    await adminClient.from('invites').update({ status: 'expired' }).eq('token', token)
    return NextResponse.json({ error: 'Invite has expired' }, { status: 410 })
  }

  // Fix: receive the userId from the client (returned by signUp/signInWithPassword)
  // and look up that single user instead of downloading the entire user list.
  // The old approach called listUsers() with no filter, which loads every auth
  // user into memory — O(n) and prone to timeouts at scale.
  let body: { userId?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const userId = typeof body.userId === 'string' ? body.userId : null
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(userId)

  if (authError || !authUser.user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Verify the authenticated user's email matches the invite to prevent
  // one user from claiming another user's invite by guessing a userId.
  if (authUser.user.email?.toLowerCase() !== invite.email?.toLowerCase()) {
    return NextResponse.json(
      { error: 'This invite was sent to a different email address.' },
      { status: 403 }
    )
  }

  // Create or update the user's profile row in this org
  const { error: profileError } = await adminClient.from('users').upsert({
    id: authUser.user.id,
    email: invite.email,
    org_id: invite.org_id!,
    role: invite.role ?? 'viewer',
  })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Mark invite as accepted
  await adminClient
    .from('invites')
    .update({ status: 'accepted' })
    .eq('token', token)

  return NextResponse.json({ ok: true })
}
