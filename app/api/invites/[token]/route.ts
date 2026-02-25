import { type NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const { data: invite } = await adminClient
    .from('invites')
    .select('email, role, org_id, expires_at, status')
    .eq('token', token)
    .single()

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 })
  }

  if (invite.status !== 'pending') {
    return NextResponse.json({ error: 'This invite has already been used or expired' }, { status: 410 })
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    await adminClient.from('invites').update({ status: 'expired' }).eq('token', token)
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 })
  }

  const { data: org } = await adminClient
    .from('orgs')
    .select('name')
    .eq('id', invite.org_id!)
    .single()

  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    orgName: org?.name ?? 'Unknown',
  })
}
