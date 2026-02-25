'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const formData = new FormData(e.currentTarget)
    try {
      const result = await signUp(formData)
      if (result?.error) {
        setError(result.error)
        setPending(false)
      }
    } catch (err: unknown) {
      if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) return
      setError('An unexpected error occurred. Please try again.')
      setPending(false)
    }
  }

  return (
    <div className="space-y-8">

      <div>
        {/* Logo only shown on mobile — desktop has it in the Grainient panel */}
        <div className="flex items-center gap-2.5 mb-7 lg:hidden">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground text-xs font-bold">AB</span>
          </div>
          <span className="font-semibold">ABPlatform</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Start running A/B experiments in minutes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Min. 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-foreground underline-offset-4 hover:underline font-medium"
        >
          Sign in
        </Link>
      </p>

    </div>
  )
}
