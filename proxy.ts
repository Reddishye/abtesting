import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico and other static assets
     * - p/* and e/* (public script endpoints — Edge, no auth needed)
     * - api/events (public event ingestion — no auth needed)
     * - api/e/* (public experiment assign endpoint — Edge, no auth needed)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico|p/|e/|api/events|api/e/).*)',
  ],
}
