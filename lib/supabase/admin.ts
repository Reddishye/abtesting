import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client.
 * Bypasses RLS — use ONLY in server-side Route Handlers and Server Actions.
 * Never import this in client components or expose to the browser.
 *
 * The Database generic is omitted intentionally — query return types are
 * applied via explicit casts at the call site for predictable inference.
 */
export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
