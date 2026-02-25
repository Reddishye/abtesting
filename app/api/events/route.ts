import { type NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const eventSchema = z.object({
  experiment_id: z.string().uuid(),
  variant: z.enum(['a', 'b']),
  event_type: z.string().min(1).max(50),
  org_id: z.string().uuid().optional(),
  payload: z
    .record(z.string(), z.unknown())
    .optional()
    .refine(
      (val) => !val || JSON.stringify(val).length <= 4096,
      { message: 'Payload must be 4 KB or smaller' }
    ),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export async function POST(req: NextRequest) {
  // Reject oversized requests before touching the body (basic DoS mitigation).
  // Full rate limiting requires an external service — see README for the Upstash pattern.
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > 10_000) {
    return NextResponse.json(
      { error: 'Request too large' },
      { status: 413, headers: corsHeaders }
    )
  }

  let body: unknown

  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400, headers: corsHeaders }
    )
  }

  const parsed = eventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 422, headers: corsHeaders }
    )
  }

  const { experiment_id, variant, event_type, org_id, payload } = parsed.data

  // Verify experiment exists, is running, and get org_id if not provided
  const { data: experiment } = await adminClient
    .from('experiments')
    .select('id, org_id, status')
    .eq('id', experiment_id)
    .single()

  if (!experiment) {
    return NextResponse.json(
      { error: 'Experiment not found' },
      { status: 404, headers: corsHeaders }
    )
  }

  if (experiment.status !== 'running') {
    return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders })
  }

  const resolvedOrgId = org_id ?? experiment.org_id

  const { error } = await adminClient.from('events').insert({
    experiment_id,
    org_id: resolvedOrgId,
    variant,
    event_type,
    payload: payload ?? {},
  })

  if (error) {
    console.error('[POST /api/events]', error)
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500, headers: corsHeaders }
    )
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders })
}
