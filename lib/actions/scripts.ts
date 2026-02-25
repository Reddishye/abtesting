'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { adminClient } from '@/lib/supabase/admin'
import { getAuthedUser } from '@/lib/actions/utils'

export async function createScript(formData: FormData) {
  const ctx = await getAuthedUser()
  if (!ctx) return { error: 'Not authenticated' }

  const name = (formData.get('name') as string) || 'Untitled script'
  const code = (formData.get('code') as string) || '// Your script here\n'

  if (!['owner', 'admin', 'editor'].includes(ctx.profile.role)) {
    return { error: 'Insufficient permissions' }
  }

  const { data, error } = await adminClient
    .from('scripts')
    .insert({
      org_id: ctx.profile.org_id,
      name,
      code,
      status: 'draft',
      version: 1,
    })
    .select()
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'Failed to create script' }
  }

  revalidateTag(`scripts:${ctx.profile.org_id}`, 'max')
  revalidatePath('/scripts')
  redirect(`/scripts/${data.id}`)
}

export async function saveDraft(data: {
  id: string
  name: string
  code: string
}) {
  const ctx = await getAuthedUser()
  if (!ctx) return { error: 'Not authenticated' }

  if (!['owner', 'admin', 'editor'].includes(ctx.profile.role)) {
    return { error: 'Insufficient permissions' }
  }

  if (data.name.length > 200) return { error: 'Name must be 200 characters or fewer' }
  if (data.code.length > 500_000) return { error: 'Script must be 500 KB or smaller' }

  const { error } = await adminClient
    .from('scripts')
    .update({ name: data.name, code: data.code })
    .eq('id', data.id)
    .eq('org_id', ctx.profile.org_id)
    .eq('status', 'draft')

  if (error) return { error: error.message }

  revalidateTag(`scripts:${ctx.profile.org_id}`, 'max')
  revalidatePath(`/scripts/${data.id}`)
  return { success: true }
}

export async function publishScript(id: string) {
  const ctx = await getAuthedUser()
  if (!ctx) return { error: 'Not authenticated' }

  if (!['owner', 'admin', 'editor'].includes(ctx.profile.role)) {
    return { error: 'Insufficient permissions' }
  }

  // Verify ownership
  const { data: script } = await adminClient
    .from('scripts')
    .select('*')
    .eq('id', id)
    .eq('org_id', ctx.profile.org_id)
    .single()

  if (!script) return { error: 'Script not found' }

  if (script.status === 'published') {
    return { error: 'Script is already published' }
  }

  const { error } = await adminClient
    .from('scripts')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
    .eq('org_id', ctx.profile.org_id)

  if (error) return { error: error.message }

  revalidateTag(`scripts:${ctx.profile.org_id}`, 'max')
  revalidatePath('/scripts')
  revalidatePath(`/scripts/${id}`)
  return { success: true, id }
}

export async function forkScript(id: string) {
  const ctx = await getAuthedUser()
  if (!ctx) return { error: 'Not authenticated' }

  if (!['owner', 'admin', 'editor'].includes(ctx.profile.role)) {
    return { error: 'Insufficient permissions' }
  }

  const { data: original } = await adminClient
    .from('scripts')
    .select('*')
    .eq('id', id)
    .eq('org_id', ctx.profile.org_id)
    .single()

  if (!original) return { error: 'Script not found' }

  const { data: fork, error } = await adminClient
    .from('scripts')
    .insert({
      org_id: ctx.profile.org_id,
      name: original.name,
      code: original.code,
      status: 'draft',
      version: original.version + 1,
      parent_id: original.parent_id ?? original.id,
      // Fix: preserve allowed_origins from the original so the fork inherits
      // the same origin restrictions instead of defaulting to ['*'].
      allowed_origins: original.allowed_origins,
    })
    .select()
    .single()

  if (error || !fork) {
    return { error: error?.message ?? 'Failed to fork script' }
  }

  revalidateTag(`scripts:${ctx.profile.org_id}`, 'max')
  revalidatePath('/scripts')
  redirect(`/scripts/${fork.id}`)
}

export async function updateScriptAllowedOrigins(id: string, origins: string[]) {
  const ctx = await getAuthedUser()
  if (!ctx) return { error: 'Not authenticated' }

  if (!['owner', 'admin'].includes(ctx.profile.role)) {
    return { error: 'Only admins and owners can change allowed origins' }
  }

  if (origins.length > 50) return { error: 'Maximum 50 allowed origins' }

  const cleaned = origins.map((o) => o.trim()).filter(Boolean)
  const final = cleaned.length === 0 ? ['*'] : cleaned

  const { error } = await adminClient
    .from('scripts')
    .update({ allowed_origins: final })
    .eq('id', id)
    .eq('org_id', ctx.profile.org_id)

  if (error) return { error: error.message }

  revalidateTag(`scripts:${ctx.profile.org_id}`, 'max')
  revalidatePath(`/scripts/${id}`)
  return { success: true }
}

export async function archiveScript(id: string) {
  const ctx = await getAuthedUser()
  if (!ctx) return { error: 'Not authenticated' }

  if (!['owner', 'admin'].includes(ctx.profile.role)) {
    return { error: 'Only admins and owners can archive scripts' }
  }

  // Fix: prevent archiving a script that is actively used by a running experiment.
  // Archiving it would cause that experiment's variant to serve a 404.
  const { data: activeExperiments } = await adminClient
    .from('experiments')
    .select('id, name')
    .eq('status', 'running')
    .eq('org_id', ctx.profile.org_id)
    .or(`script_a.eq.${id},script_b.eq.${id}`)

  if (activeExperiments && activeExperiments.length > 0) {
    return {
      error:
        'This script is used by one or more running experiments. Pause or stop those experiments before archiving.',
    }
  }

  const { error } = await adminClient
    .from('scripts')
    .update({ status: 'archived' })
    .eq('id', id)
    .eq('org_id', ctx.profile.org_id)

  if (error) return { error: error.message }

  revalidateTag(`scripts:${ctx.profile.org_id}`, 'max')
  revalidatePath('/scripts')
  redirect('/scripts')
}
