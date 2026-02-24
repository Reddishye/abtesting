'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [invite, setInvite] = useState<{
    email: string
    role: string
    orgName: string
  } | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'success'>('loading')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Invalid invite link.')
      return
    }

    fetch(`/api/invites/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setStatus('error')
          setError(data.error)
        } else {
          setInvite(data)
          setStatus('ready')
        }
      })
      .catch(() => {
        setStatus('error')
        setError('Failed to load invite.')
      })
  }, [token])

  async function handleAccept(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!token) return

    setPending(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string

    const supabase = createClient()

    // Sign up or sign in with the invited email
    const { error: authError } = await supabase.auth.signUp({
      email: invite!.email,
      password,
    })

    if (authError && !authError.message.includes('already registered')) {
      setError(authError.message)
      setPending(false)
      return
    }

    // Accept the invite server-side
    const result = await fetch(`/api/invites/${token}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
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

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Invalid invite
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <a href="/login">Go to login</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (status === 'success') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            Joined successfully!
          </CardTitle>
          <CardDescription>Redirecting to dashboard…</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accept invitation</CardTitle>

        <CardDescription>
          You&apos;ve been invited to join <strong>{invite?.orgName}</strong> as{' '}
          <strong>{invite?.role}</strong>.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleAccept}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={invite?.email ?? ''} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Create a password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Join organization
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8">Loading…</div>}>
      <AcceptInviteContent />
    </Suspense>
  )
}
