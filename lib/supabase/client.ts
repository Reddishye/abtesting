import { createBrowserClient } from '@supabase/ssr'

// Types are applied at the query level via explicit casts.
// The Database generic is omitted to avoid Supabase v2 type inference issues
// with hand-written type definitions.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}
