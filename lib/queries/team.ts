import { adminClient } from '@/lib/supabase/admin'
import type { InviteRow, UserRow } from '@/lib/types/database.types'

export async function getMembersByOrg(orgId: string): Promise<UserRow[]> {
  const { data, error } = await adminClient
    .from('users')
    .select('*')
    .eq('org_id', orgId)
    .order('role', { ascending: true })

  if (error) return []
  return data ?? []
}

export async function getInvitesByOrg(orgId: string): Promise<InviteRow[]> {
  const { data, error } = await adminClient
    .from('invites')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'pending')
    .order('expires_at', { ascending: true })

  if (error) return []
  return data ?? []
}
