import type { NextRequest } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { getRequestOrigin, resolveCorOrigin } from '@/lib/utils/origins'

export const runtime = 'edge'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await adminClient
    .from('scripts')
    .select('code, name, allowed_origins')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (error || !data) {
    return new Response('// Script not found\n', {
      status: 404,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  const allowedOrigins: string[] = data.allowed_origins ?? ['*']
  const requestOrigin = getRequestOrigin(req)
  const corsOrigin = resolveCorOrigin(requestOrigin, allowedOrigins)

  // If origins are restricted and this request's origin isn't in the list, deny
  if (!allowedOrigins.includes('*') && requestOrigin && corsOrigin === null) {
    return new Response('// Access denied: this origin is not authorised to load this script.\n', {
      status: 403,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Access-Control-Allow-Origin': 'null',
      },
    })
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/javascript; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': corsOrigin ?? '*',
  }

  if (allowedOrigins.includes('*')) {
    headers['Cache-Control'] = 'public, max-age=60, stale-while-revalidate=300'
  } else {
    // Cache privately per-origin; must not share across origins
    headers['Cache-Control'] = 'private, max-age=60'
    headers['Vary'] = 'Origin'
  }

  return new Response(data.code, { status: 200, headers })
}

// Preflights for <script src> (simple GET requests) are never sent by browsers.
// This OPTIONS handler only fires for programmatic fetch() calls with custom headers.
// Origin enforcement happens on the GET handler, so we can return permissive preflight
// headers here without an extra DB round-trip.
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
