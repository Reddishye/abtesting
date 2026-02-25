import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

/**
 * Cached per-request: returns the authenticated user.
 * Calling this multiple times in the same request (layout + page) costs only one auth round-trip.
 */
export const getUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

/**
 * Cached cross-request (5 min) + per-request deduplicated.
 * Profile data rarely changes; invalidate via revalidateTag(`profile:${userId}`, 'max').
 */
export const getUserProfile = cache(async (userId: string) => {
  return unstable_cache(
    async () => {
      const { data } = await adminClient
        .from('users')
        .select('org_id, email, role')
        .eq('id', userId)
        .single()
      return data
    },
    [`profile:${userId}`],
    { tags: [`profile:${userId}`], revalidate: 300 }
  )()
})
