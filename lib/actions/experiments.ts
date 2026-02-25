'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { adminClient } from '@/lib/supabase/admin'
import { getAuthedUser } from '@/lib/actions/utils'
import type { ExperimentStatus, ExperimentWeights } from '@/lib/types/database.types'

export async function createExperiment(formData: FormData) {
  const ctx = await getAuthedUser()
  if (!ctx) return { error: 'Not authenticated' }

  if (!['owner', 'admin', 'editor'].includes(ctx.profile.role)) {
    return { error: 'Insufficient permissions' }
  }

  const name = formData.get('name') as string
  const scriptA = formData.get('script_a') as string
  const scriptB = formData.get('script_b') as string
  const weightA = parseInt(formData.get('weight_a') as string, 10)
  const weightB = parseInt(formData.get('weight_b') as string, 10)

  if (!name || !scriptA || !scriptB) {
    return { error: 'Name and both scripts are required' }
  }

  if (scriptA === scriptB) {
    return { error: 'Script A and Script B must be different' }
  }

  if (weightA + weightB !== 100) {
    return { error: 'Weights must sum to 100' }
  }

  // Verify both scripts belong to this org
  const { data: scripts } = await adminClient
    .from('scripts')
    .select('id, status')
    .in('id', [scriptA, scriptB])
    .eq('org_id', ctx.profile.org_id)

  if (!scripts || scripts.length !== 2) {
    return { error: 'Invalid scripts selected' }
  }

  const { data, error } = await adminClient
    .from('experiments')
    .insert({
      org_id: ctx.profile.org_id,
      name,
      script_a: scriptA,
      script_b: scriptB,
      weights: { a: weightA, b: weightB },
      status: 'draft',
    })
    .select()
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'Failed to create experiment' }
  }

  revalidateTag(`experiments:${ctx.profile.org_id}`, 'max')
  revalidatePath('/experiments')
  redirect(`/experiments/${data.id}`)
}

export async function updateExperimentWeights(
  id: string,
  weights: ExperimentWeights
) {
  const ctx = await getAuthedUser()
  if (!ctx) return { error: 'Not authenticated' }

  // Fix: editors and above can change weights, viewers cannot.
  if (!['owner', 'admin', 'editor'].includes(ctx.profile.role)) {
    return { error: 'Insufficient permissions' }
  }

  if (weights.a + weights.b !== 100) {
    return { error: 'Weights must sum to 100' }
  }

  const { error } = await adminClient
    .from('experiments')
    .update({ weights })
    .eq('id', id)
    .eq('org_id', ctx.profile.org_id)

  if (error) return { error: error.message }

  revalidateTag(`experiments:${ctx.profile.org_id}`, 'max')
  revalidatePath(`/experiments/${id}`)
  return { success: true }
}

export async function setExperimentStatus(
  id: string,
  status: ExperimentStatus
) {
  const ctx = await getAuthedUser()
  if (!ctx) return { error: 'Not authenticated' }

  // Fix: split permission by target status.
  // - archived requires admin or owner (destructive, not easily reversible).
  // - running / paused / completed requires editor or above.
  if (status === 'archived') {
    if (!['owner', 'admin'].includes(ctx.profile.role)) {
      return { error: 'Only admins and owners can archive experiments' }
    }
  } else {
    if (!['owner', 'admin', 'editor'].includes(ctx.profile.role)) {
      return { error: 'Insufficient permissions' }
    }
  }

  const { error } = await adminClient
    .from('experiments')
    .update({ status })
    .eq('id', id)
    .eq('org_id', ctx.profile.org_id)

  if (error) return { error: error.message }

  revalidateTag(`experiments:${ctx.profile.org_id}`, 'max')
  revalidatePath('/experiments')
  revalidatePath(`/experiments/${id}`)
  return { success: true }
}

export async function updateExperimentAllowedOrigins(id: string, origins: string[]) {
  const ctx = await getAuthedUser()
  if (!ctx) return { error: 'Not authenticated' }

  if (!['owner', 'admin'].includes(ctx.profile.role)) {
    return { error: 'Only admins and owners can change allowed origins' }
  }

  if (origins.length > 50) return { error: 'Maximum 50 allowed origins' }

  const cleaned = origins.map((o) => o.trim()).filter(Boolean)
  const final = cleaned.length === 0 ? ['*'] : cleaned

  const { error } = await adminClient
    .from('experiments')
    .update({ allowed_origins: final })
    .eq('id', id)
    .eq('org_id', ctx.profile.org_id)

  if (error) return { error: error.message }

  revalidateTag(`experiments:${ctx.profile.org_id}`, 'max')
  revalidatePath(`/experiments/${id}`)
  return { success: true }
}

export async function archiveExperiment(id: string) {
  const ctx = await getAuthedUser()
  if (!ctx) return { error: 'Not authenticated' }

  if (!['owner', 'admin'].includes(ctx.profile.role)) {
    return { error: 'Only admins and owners can archive experiments' }
  }

  const { error } = await adminClient
    .from('experiments')
    .update({ status: 'archived' })
    .eq('id', id)
    .eq('org_id', ctx.profile.org_id)

  if (error) return { error: error.message }

  revalidateTag(`experiments:${ctx.profile.org_id}`, 'max')
  revalidatePath('/experiments')
  redirect('/experiments')
}
