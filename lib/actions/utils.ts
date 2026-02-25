'use server'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function getAuthedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await adminClient
    .from('users')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return { user, profile }
}
