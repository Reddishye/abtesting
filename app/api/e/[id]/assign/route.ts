import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { selectVariant } from '@/lib/utils/experiment'
import { getRequestOrigin, resolveCorOrigin } from '@/lib/utils/origins'
import { buildScriptUrl } from '@/lib/utils/script-url'

export const runtime = 'edge'

/**
 * GET /api/e/[id]/assign
 *
 * Called by the loader script on the host page's first visit to an experiment.
 * Selects a variant based on configured weights and returns the URL of the
 * corresponding published script.
 *
 * Returns:
 *   { variant: "a" | "b", url: string }  — experiment is running
 *   { variant: null, url: null }          — experiment not running (graceful no-op)
 *
 * Impression tracking is NOT done here. The loader calls /api/events directly
 * after receiving the assignment, keeping impression tracking on a single code
 * path for both first visits (via /assign) and return visits (via localStorage).
 *
 * Always no-store: must reflect the current experiment status on every call.
 */

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: experiment } = await adminClient
    .from('experiments')
    .select('id, status, script_a, script_b, weights, allowed_origins')
    .eq('id', id)
    .single()

  // Return a graceful no-op if the experiment doesn't exist or isn't running.
  // The loader will silently do nothing when variant is null.
  if (!experiment || experiment.status !== 'running') {
    return NextResponse.json(
      { variant: null, url: null },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        },
      }
    )
  }

  // Origin enforcement — same logic as /e/[id]
  const allowedOrigins: string[] = experiment.allowed_origins ?? ['*']
  const requestOrigin = getRequestOrigin(req)
  const corsOrigin = resolveCorOrigin(requestOrigin, allowedOrigins)

  const responseHeaders: Record<string, string> = {
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': corsOrigin ?? '*',
    ...(corsOrigin !== '*' ? { Vary: 'Origin' } : {}),
  }

  if (!allowedOrigins.includes('*') && requestOrigin && corsOrigin === null) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403, headers: responseHeaders }
    )
  }

  const variant = selectVariant(experiment.weights)
  const scriptId = variant === 'a' ? experiment.script_a : experiment.script_b
  const url = scriptId ? buildScriptUrl(scriptId) : null

  return NextResponse.json(
    { variant, url },
    { status: 200, headers: responseHeaders }
  )
}
