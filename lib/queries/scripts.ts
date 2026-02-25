import { unstable_cache } from 'next/cache'
import { adminClient } from '@/lib/supabase/admin'
import type { ScriptRow } from '@/lib/types/database.types'

export function getScriptsByOrg(orgId: string): Promise<ScriptRow[]> {
  return unstable_cache(
    async () => {
      const { data, error } = await adminClient
        .from('scripts')
        .select('*')
        .eq('org_id', orgId)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[getScriptsByOrg]', error)
        return []
      }

      return data ?? []
    },
    [`scripts:${orgId}`],
    { tags: [`scripts:${orgId}`] }
  )()
}

export function getScriptById(id: string, orgId: string): Promise<ScriptRow | null> {
  return unstable_cache(
    async () => {
      const { data, error } = await adminClient
        .from('scripts')
        .select('*')
        .eq('id', id)
        .eq('org_id', orgId)
        .single()

      if (error) return null
      return data
    },
    [`script:${id}`],
    { tags: [`scripts:${orgId}`] }
  )()
}

export function getVersionHistory(scriptId: string, orgId: string): Promise<ScriptRow[]> {
  return unstable_cache(
    async () => {
      const { data: root } = await adminClient
        .from('scripts')
        .select('*')
        .eq('id', scriptId)
        .eq('org_id', orgId)
        .single()

      if (!root) return []

      const rootId = root.parent_id ?? root.id

      const { data, error } = await adminClient
        .from('scripts')
        .select('*')
        .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
        .eq('org_id', orgId)
        .order('version', { ascending: true })

      if (error) return []
      return data ?? []
    },
    [`script-versions:${scriptId}`],
    { tags: [`scripts:${orgId}`] }
  )()
}
