'use client'

import { useState } from 'react'
import { createOrgAndProfile } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertCircle, Building2, Loader2 } from 'lucide-react'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
}

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)

  function handleOrgNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugEdited) {
      setSlug(generateSlug(e.target.value))
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugEdited(true)
    setSlug(e.target.value)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const formData = new FormData(e.currentTarget)
    try {
      const result = await createOrgAndProfile(formData)
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
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">AB</span>
          </div>
          <span className="font-semibold text-lg">ABPlatform</span>
        </div>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Create your organization
        </CardTitle>
        <CardDescription>
          Your organization is the workspace where you manage scripts,
          experiments, and team members.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="orgName">Organization name</Label>
            <Input
              id="orgName"
              name="orgName"
              placeholder="Acme Corp"
              required
              minLength={2}
              maxLength={60}
              onChange={handleOrgNameChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <div className="flex items-center gap-0">
              <span className="text-sm text-muted-foreground border border-r-0 border-input rounded-l-md px-3 py-2 bg-muted h-10 flex items-center select-none">
                abplatform.com/
              </span>
              <Input
                id="slug"
                name="slug"
                placeholder="acme-corp"
                required
                value={slug}
                onChange={handleSlugChange}
                minLength={2}
                maxLength={40}
                className="rounded-l-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Only lowercase letters, numbers and hyphens. Cannot be changed
              later.
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create organization
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
