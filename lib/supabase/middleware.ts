import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do not remove this getUser() call
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const isAuthRoute =
    url.pathname.startsWith('/login') || url.pathname.startsWith('/signup')
  const isPublicRoute =
    url.pathname.startsWith('/p/') ||
    url.pathname.startsWith('/e/') ||
    url.pathname.startsWith('/api/events')

  if (isPublicRoute) {
    return supabaseResponse
  }

  // Accept-invite page and its API routes must be reachable by both
  // authenticated and unauthenticated users. The page handles auth internally
  // (sign-up / sign-in then accept), so we skip all redirect logic here.
  if (
    url.pathname.startsWith('/accept-invite') ||
    url.pathname.startsWith('/api/invites/')
  ) {
    return supabaseResponse
  }

  if (!user && !isAuthRoute) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (user && !isAuthRoute) {
    const onboarded = request.cookies.get('x-onboarded')?.value

    // Fast path: cookie says onboarded — redirect away from /onboarding
    if (onboarded && url.pathname === '/onboarding') {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Slow path: no cookie — check DB via service role to bypass RLS
    if (!onboarded) {
      const { data: profile } = await adminClient
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // No profile — must complete onboarding
        if (url.pathname !== '/onboarding') {
          url.pathname = '/onboarding'
          return NextResponse.redirect(url)
        }
        // Already at /onboarding — let them through
        return supabaseResponse
      }

      // Profile exists — set cookie and redirect away from /onboarding
      supabaseResponse.cookies.set('x-onboarded', '1', {
        maxAge: 60 * 60 * 24, // 24h
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })

      if (url.pathname === '/onboarding') {
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
