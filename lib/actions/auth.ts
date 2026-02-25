'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const onboardingSchema = z.object({
  orgName: z.string().min(2).max(60),
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens'),
})

export async function signIn(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signUp(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/onboarding')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function createOrgAndProfile(formData: FormData) {
  const parsed = onboardingSchema.safeParse({
    orgName: formData.get('orgName'),
    slug: formData.get('slug'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // If user already has a profile, skip creation and go to dashboard
  const { data: existingProfile } = await adminClient
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (existingProfile) {
    redirect('/dashboard')
  }

  // Check slug uniqueness
  const { data: existing } = await adminClient
    .from('orgs')
    .select('id')
    .eq('slug', parsed.data.slug)
    .single()

  if (existing) {
    return { error: 'This slug is already taken. Please choose another.' }
  }

  // Create org using service role to bypass insert check during onboarding
  const { data: org, error: orgError } = await adminClient
    .from('orgs')
    .insert({ name: parsed.data.orgName, slug: parsed.data.slug })
    .select()
    .single()

  if (orgError || !org) {
    return { error: orgError?.message ?? 'Failed to create organization' }
  }

  // Create user profile
  const { error: userError } = await adminClient.from('users').insert({
    id: user.id,
    email: user.email ?? null,
    org_id: org.id,
    role: 'owner',
  })

  if (userError) {
    // Roll back org creation
    await adminClient.from('orgs').delete().eq('id', org.id)
    return { error: userError.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
