'use client'

import { useMemo, useState } from 'react'
import { createExperiment } from '@/lib/actions/experiments'
import { WeightSlider } from '@/components/experiments/WeightSlider'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { AlertCircle, FlaskConical, Loader2 } from 'lucide-react'
import { sileo } from 'sileo'
import type { ScriptRow } from '@/lib/types/database.types'

interface CreateExperimentFormProps {
  publishedScripts: ScriptRow[]
}

export function CreateExperimentForm({ publishedScripts }: CreateExperimentFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [nameA, setNameA] = useState('')
  const [nameB, setNameB] = useState('')
  const [scriptA, setScriptA] = useState('')
  const [scriptB, setScriptB] = useState('')
  const [weights, setWeights] = useState({ a: 50, b: 50 })

  // Group scripts by name, sorted by version descending (latest first)
  const scriptsByName = useMemo(() => {
    const groups: Record<string, ScriptRow[]> = {}
    for (const script of publishedScripts) {
      const name = script.name ?? 'Untitled'
      if (!groups[name]) groups[name] = []
      groups[name].push(script)
    }
    for (const name in groups) {
      groups[name].sort((a, b) => b.version - a.version)
    }
    return groups
  }, [publishedScripts])

  const uniqueNames = useMemo(() => Object.keys(scriptsByName), [scriptsByName])

  function handleNameAChange(name: string) {
    setNameA(name)
    const latest = scriptsByName[name]?.[0]
    setScriptA(latest?.id ?? '')
  }

  function handleNameBChange(name: string) {
    setNameB(name)
    const latest = scriptsByName[name]?.[0]
    setScriptB(latest?.id ?? '')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!scriptA || !scriptB) {
      setError('Please select scripts for both variants.')
      return
    }
    if (scriptA === scriptB) {
      setError('Variants A and B must use different scripts.')
      return
    }

    setPending(true)
    const formData = new FormData(e.currentTarget)
    formData.set('script_a', scriptA)
    formData.set('script_b', scriptB)
    formData.set('weight_a', String(weights.a))
    formData.set('weight_b', String(weights.b))

    try {
      const result = await createExperiment(formData)
      if (result?.error) {
        setError(result.error)
        sileo.error({ title: result.error })
        setPending(false)
      }
    } catch (err: unknown) {
      if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) return
      setError('An unexpected error occurred. Please try again.')
      setPending(false)
    }
  }

  const versionsA = nameA ? scriptsByName[nameA] ?? [] : []
  const versionsB = nameB ? scriptsByName[nameB] ?? [] : []
  const hasMultipleVersionsA = versionsA.length > 1
  const hasMultipleVersionsB = versionsB.length > 1

  return (
    <>
      {uniqueNames.length < 2 && (
        <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 mb-6 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            You need at least 2 published scripts to create an experiment.{' '}
            <a href="/scripts/new" className="underline font-medium">
              Create and publish scripts first.
            </a>
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Experiment configuration
          </CardTitle>
          <CardDescription>
            Configure which scripts to test and how to distribute traffic.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Experiment name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Homepage CTA button test"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Variant A */}
              <div className="space-y-2">
                <Label>
                  <span className="text-blue-500 font-semibold">Variant A</span> script
                </Label>
                <Select value={nameA} onValueChange={handleNameAChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select script" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasMultipleVersionsA && (
                  <Select value={scriptA} onValueChange={setScriptA}>
                    <SelectTrigger className="text-xs text-muted-foreground">
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {versionsA.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          v{s.version}
                          {s.id === versionsA[0].id ? ' (latest)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Variant B */}
              <div className="space-y-2">
                <Label>
                  <span className="text-purple-500 font-semibold">Variant B</span> script
                </Label>
                <Select value={nameB} onValueChange={handleNameBChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select script" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasMultipleVersionsB && (
                  <Select value={scriptB} onValueChange={setScriptB}>
                    <SelectTrigger className="text-xs text-muted-foreground">
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {versionsB.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          v{s.version}
                          {s.id === versionsB[0].id ? ' (latest)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Traffic split</Label>
              <WeightSlider onWeightsChange={(a, b) => setWeights({ a, b })} />
            </div>

            <Button
              type="submit"
              disabled={uniqueNames.length < 2 || pending}
              className="w-full"
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create experiment
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
