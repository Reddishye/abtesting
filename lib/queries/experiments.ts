import { unstable_cache } from 'next/cache'
import { adminClient } from '@/lib/supabase/admin'
import type { ExperimentRow, ScriptRow } from '@/lib/types/database.types'

export interface ExperimentWithScripts extends ExperimentRow {
  script_a_data: ScriptRow | null
  script_b_data: ScriptRow | null
}

export interface ExperimentStats {
  variant_a_impressions: number
  variant_b_impressions: number
  total: number
}

export function getExperimentsByOrg(orgId: string): Promise<ExperimentRow[]> {
  return unstable_cache(
    async () => {
      // Fix: exclude archived experiments, matching getScriptsByOrg behaviour.
      const { data, error } = await adminClient
        .from('experiments')
        .select('*')
        .eq('org_id', orgId)
        .neq('status', 'archived')
        .order('status', { ascending: true })

      if (error) {
        console.error('[getExperimentsByOrg]', error)
        return []
      }

      return data ?? []
    },
    [`experiments:${orgId}`],
    { tags: [`experiments:${orgId}`] }
  )()
}

export function getExperimentById(
  id: string,
  orgId: string
): Promise<ExperimentWithScripts | null> {
  return unstable_cache(
    async () => {
      const { data: experiment, error } = await adminClient
        .from('experiments')
        .select('*')
        .eq('id', id)
        .eq('org_id', orgId)
        .single()

      if (error || !experiment) return null

      // Single query for both scripts instead of two separate requests
      const scriptIds = [experiment.script_a, experiment.script_b].filter(
        (s): s is string => !!s
      )

      const { data: scripts } =
        scriptIds.length > 0
          ? await adminClient.from('scripts').select('*').in('id', scriptIds)
          : { data: [] }

      const scriptMap = new Map((scripts ?? []).map((s) => [s.id, s]))

      return {
        ...experiment,
        script_a_data: experiment.script_a
          ? (scriptMap.get(experiment.script_a) ?? null)
          : null,
        script_b_data: experiment.script_b
          ? (scriptMap.get(experiment.script_b) ?? null)
          : null,
      }
    },
    [`experiment:${id}`],
    { tags: [`experiments:${orgId}`] }
  )()
}

export async function getExperimentStats(
  experimentId: string
): Promise<ExperimentStats> {
  // Two fast COUNT queries — no row data transferred
  const [{ count: aCount }, { count: bCount }] = await Promise.all([
    adminClient
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('experiment_id', experimentId)
      .eq('event_type', 'impression')
      .eq('variant', 'a'),
    adminClient
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('experiment_id', experimentId)
      .eq('event_type', 'impression')
      .eq('variant', 'b'),
  ])

  const a = aCount ?? 0
  const b = bCount ?? 0

  return {
    variant_a_impressions: a,
    variant_b_impressions: b,
    total: a + b,
  }
}
