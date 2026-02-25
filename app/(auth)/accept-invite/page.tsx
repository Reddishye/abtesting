'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type InviteDetails = {
  email: string
  role: string
  orgName: string
}

type PageStatus = 'loading' | 'auth' | 'confirm' | 'success' | 'error'

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [status, setStatus] = useState<PageStatus>('loading')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The authenticated userId — either from an existing session or after sign-up/in
  const [authedUserId, setAuthedUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Invalid invite link.')
      return
    }

    async function load() {
      const supabase = createClient()

      // Fetch invite details
      const res = await fetch(`/api/invites/${token}`)
      const data = await res.json()

      if (data.error) {
        setStatus('error')
        setError(data.error)
        return
      }

      const details: InviteDetails = data
      setInvite(details)

      // Check if the user is already authenticated
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const sessionEmail = session.user.email?.toLowerCase()
        const inviteEmail = details.email?.toLowerCase()

        if (sessionEmail !== inviteEmail) {
          // Logged in as a different account — can't use this invite
          setStatus('error')
          setError(
            `You're signed in as ${session.user.email}, but this invite is for ${details.email}. ` +
            'Please sign out first and then open the invite link again.'
          )
          return
        }

        // Already authenticated with the right email — go straight to confirm
        setAuthedUserId(session.user.id)
        setStatus('confirm')
      } else {
        // Not authenticated — show sign-up / sign-in form
        setStatus('auth')
      }
    }

    load().catch(() => {
      setStatus('error')
      setError('Failed to load invite.')
    })
  }, [token])

  async function handleAuth(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!token || !invite) return

    setPending(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const supabase = createClient()

    let userId: string | null = null

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: invite.email,
      password,
    })

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: invite.email,
          password,
        })
        if (signInError) {
          setError(signInError.message)
          setPending(false)
          return
        }
        userId = signInData.user?.id ?? null
      } else {
        setError(signUpError.message)
        setPending(false)
        return
      }
    } else {
      userId = signUpData.user?.id ?? null
    }

    if (!userId) {
      setError('Could not determine user account. Please try again.')
      setPending(false)
      return
    }

    setAuthedUserId(userId)
    setPending(false)
    setStatus('confirm')
  }

  async function handleAccept() {
    if (!token || !authedUserId) return
    setPending(true)
    setError(null)

    const result = await fetch(`/api/invites/${token}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: authedUserId }),
    })

    const data = await result.json()

    if (data.error) {
      setError(data.error)
      setPending(false)
      return
    }

    setStatus('success')
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  // ── Loading ──
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ── Error ──
  if (status === 'error') {
    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2.5 mb-7 lg:hidden">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-xs font-bold">AB</span>
            </div>
            <span className="font-semibold">ABPlatform</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Invalid invite</h1>
          <p className="text-muted-foreground text-sm mt-1.5">{error}</p>
        </div>
        <Link href="/login" className="text-sm text-foreground underline-offset-4 hover:underline font-medium">
          Go to login
        </Link>
      </div>
    )
  }

  // ── Success ──
  if (status === 'success') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="font-semibold">Joined successfully!</span>
        </div>
        <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
      </div>
    )
  }

  // ── Confirm (already authenticated) ──
  if (status === 'confirm') {
    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2.5 mb-7 lg:hidden">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-xs font-bold">AB</span>
            </div>
            <span className="font-semibold">ABPlatform</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Accept invitation</h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            You&apos;ve been invited to join <strong>{invite?.orgName}</strong> as{' '}
            <strong>{invite?.role}</strong>.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button className="w-full" disabled={pending} onClick={handleAccept}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Join {invite?.orgName}
        </Button>
      </div>
    )
  }

  // ── Auth (sign up / sign in) ──
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2.5 mb-7 lg:hidden">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground text-xs font-bold">AB</span>
          </div>
          <span className="font-semibold">ABPlatform</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Accept invitation</h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Join <strong>{invite?.orgName}</strong> as <strong>{invite?.role}</strong>.
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={invite?.email ?? ''} disabled />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={8}
            autoComplete="current-password"
          />
          <p className="text-xs text-muted-foreground">
            New user? Create a password. Already have an account? Enter your existing one.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue
        </Button>
      </form>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}
