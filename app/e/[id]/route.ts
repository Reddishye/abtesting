import type { NextRequest } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { getRequestOrigin, resolveCorOrigin } from '@/lib/utils/origins'
import { buildScriptUrl } from '@/lib/utils/script-url'

export const runtime = 'edge'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

/**
 * Builds the loader script served to the host page.
 *
 * The loader (~500 bytes) runs in the host page's JS context and handles
 * variant stickiness via localStorage — avoiding the third-party cookie
 * restrictions imposed by Safari ITP, Firefox ETP and Chrome Privacy Sandbox.
 *
 * Flow:
 *   First visit  → calls /api/e/{id}/assign → stores variant in localStorage → injects script
 *   Return visit → reads localStorage → injects script directly (no /assign call)
 *   Both paths   → send an impression event to /api/events
 */
function buildLoader(opts: {
  experimentId: string
  appUrl: string
  scriptAUrl: string | null
  scriptBUrl: string | null
}): string {
  // Inline, minified IIFE. Variables are JSON-stringified to prevent injection.
  return `;(function(){
var EID=${JSON.stringify(opts.experimentId)};
var KEY="__ab_"+EID;
var APP=${JSON.stringify(opts.appUrl)};
var URLS={a:${JSON.stringify(opts.scriptAUrl)},b:${JSON.stringify(opts.scriptBUrl)}};
if(!APP)return;
function inject(url){if(!url)return;var s=document.createElement('script');s.src=url;s.async=true;document.head.appendChild(s);}
function track(v){try{fetch(APP+'/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({experiment_id:EID,variant:v,event_type:'impression'}),keepalive:true});}catch(e){}}
var stored;try{stored=localStorage.getItem(KEY);}catch(e){}
if(stored==='a'||stored==='b'){inject(URLS[stored]);track(stored);return;}
fetch(APP+'/api/e/'+EID+'/assign',{credentials:'omit'})
  .then(function(r){return r.ok?r.json():null;})
  .then(function(d){if(!d||!d.variant)return;try{localStorage.setItem(KEY,d.variant);}catch(e){}inject(d.url);track(d.variant);})
  .catch(function(){});
})();`
}

function jsResponse(body: string, status: number, corsOrigin: string) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Access-Control-Allow-Origin': corsOrigin,
    },
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: experiment, error } = await adminClient
    .from('experiments')
    .select('id, status, script_a, script_b, allowed_origins')
    .eq('id', id)
    .single()

  if (error || !experiment) {
    return jsResponse('// Experiment not found\n', 404, '*')
  }

  if (experiment.status !== 'running') {
    return jsResponse(
      `// Experiment is not running (status: ${experiment.status}).\n`,
      200,
      '*'
    )
  }

  const allowedOrigins: string[] = experiment.allowed_origins ?? ['*']
  const requestOrigin = getRequestOrigin(req)
  const corsOrigin = resolveCorOrigin(requestOrigin, allowedOrigins)

  if (!allowedOrigins.includes('*') && requestOrigin && corsOrigin === null) {
    return jsResponse('// Access denied: this origin is not authorised for this experiment.\n', 403, 'null')
  }

  const scriptAUrl = experiment.script_a ? buildScriptUrl(experiment.script_a) : null
  const scriptBUrl = experiment.script_b ? buildScriptUrl(experiment.script_b) : null

  const loader = buildLoader({
    experimentId: id,
    appUrl: APP_URL,
    scriptAUrl,
    scriptBUrl,
  })

  // The loader itself is safe to cache: it contains no variant assignment and no user data.
  // Variant selection happens at /api/e/[id]/assign (always no-store).
  // If the experiment is paused/stopped, /assign returns { variant: null } → loader is a no-op.
  const cacheControl = allowedOrigins.includes('*')
    ? 'public, max-age=300, stale-while-revalidate=600'
    : 'private, max-age=300'

  return new Response(loader, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': cacheControl,
      'Access-Control-Allow-Origin': corsOrigin ?? '*',
      'X-Content-Type-Options': 'nosniff',
      ...(!allowedOrigins.includes('*') ? { Vary: 'Origin' } : {}),
    },
  })
}

export async function OPTIONS(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { data } = await adminClient
    .from('experiments')
    .select('allowed_origins')
    .eq('id', id)
    .single()

  const allowedOrigins: string[] = data?.allowed_origins ?? ['*']
  const requestOrigin = req.headers.get('origin')
  const corsOrigin = resolveCorOrigin(requestOrigin, allowedOrigins)

  if (!allowedOrigins.includes('*') && requestOrigin && corsOrigin === null) {
    return new Response(null, { status: 403 })
  }

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': corsOrigin ?? '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Max-Age': '86400',
      ...(corsOrigin !== '*' ? { Vary: 'Origin' } : {}),
    },
  })
}
