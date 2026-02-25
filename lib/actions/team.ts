'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { adminClient } from '@/lib/supabase/admin'
import { getAuthedUser } from '@/lib/actions/utils'
import { z } from 'zod'
import type { UserRole } from '@/lib/types/database.types'

const INVITE_EXPIRY_DAYS = 7

export async function inviteMember(formData: FormData) {
  const ctx = await getAuthedUser()
  if (!ctx) return { error: 'Not authenticated' }

  if (!['owner', 'admin'].includes(ctx.profile.role)) {
    return { error: 'Only owners and admins can invite members' }
  }

  const parsed = z
    .object({
      email: z.string().email(),
      role: z.enum(['admin', 'editor', 'viewer']),
    })
    .safeParse({
      email: formData.get('email'),
      role: formData.get('role'),
    })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Check if user is already a member of this org
  const { data: existingUser } = await adminClient
    .from('users')
    .select('id')
    .eq('email', parsed.data.email)
    .eq('org_id', ctx.profile.org_id)
    .single()

  if (existingUser) {
    return { error: 'This user is already a member of your organization' }
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS)

  // Fix: use explicit check + insert/update instead of upsert with `onConflict: 'email'`.
  // The old onConflict: 'email' matched globally across all orgs, so two orgs inviting
  // the same email address would overwrite each other's invite (multi-tenancy bug).
  const { data: existingInvite } = await adminClient
    .from('invites')
    .select('id')
    .eq('org_id', ctx.profile.org_id)
    .eq('email', parsed.data.email)
    .maybeSingle()

  const newToken = crypto.randomUUID()

  let invite: { id: string; token: string | null } | null = null
  let inviteError: { message: string } | null = null

  if (existingInvite) {
    // Refresh existing invite for this org: new token, new expiry, possibly new role
    const { data, error } = await adminClient
      .from('invites')
      .update({
        role: parsed.data.role,
        token: newToken,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .eq('id', existingInvite.id)
      .select('id, token')
      .single()
    invite = data
    inviteError = error
  } else {
    const { data, error } = await adminClient
      .from('invites')
      .insert({
        org_id: ctx.profile.org_id,
        email: parsed.data.email,
        role: parsed.data.role,
        token: newToken,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .select('id, token')
      .single()
    invite = data
    inviteError = error
  }

  if (inviteError || !invite) {
    return { error: inviteError?.message ?? 'Failed to create invite' }
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${invite.token}`

  revalidatePath('/team')
  return { success: true, inviteUrl }
}

export async function removeMember(userId: string) {
  const ctx = await getAuthedUser()
  if (!ctx) return { error: 'Not authenticated' }

  if (!['owner', 'admin'].includes(ctx.profile.role)) {
    return { error: 'Insufficient permissions' }
  }

  if (userId === ctx.user.id) {
    return { error: 'You cannot remove yourself' }
  }

  const { error } = await adminClient
    .from('users')
    .delete()
    .eq('id', userId)
    .eq('org_id', ctx.profile.org_id)

  if (error) return { error: error.message }

  revalidateTag(`profile:${userId}`, 'max')
  revalidatePath('/team')
  return { success: true }
}

export async function updateMemberRole(userId: string, role: UserRole) {
  const ctx = await getAuthedUser()
  if (!ctx) return { error: 'Not authenticated' }

  if (ctx.profile.role !== 'owner') {
    return { error: 'Only owners can change member roles' }
  }

  if (userId === ctx.user.id) {
    return { error: 'You cannot change your own role' }
  }

  const { error } = await adminClient
    .from('users')
    .update({ role })
    .eq('id', userId)
    .eq('org_id', ctx.profile.org_id)

  if (error) return { error: error.message }

  revalidateTag(`profile:${userId}`, 'max')
  revalidatePath('/team')
  return { success: true }
}

export async function revokeInvite(inviteId: string) {
  const ctx = await getAuthedUser()
  if (!ctx) return { error: 'Not authenticated' }

  const { error } = await adminClient
    .from('invites')
    .update({ status: 'expired' })
    .eq('id', inviteId)
    .eq('org_id', ctx.profile.org_id)

  if (error) return { error: error.message }

  revalidatePath('/team')
  return { success: true }
}
