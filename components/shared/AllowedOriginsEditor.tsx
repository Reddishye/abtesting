'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, ShieldCheck } from 'lucide-react'
import { sileo } from 'sileo'

interface AllowedOriginsEditorProps {
  resourceId: string
  initialOrigins: string[]
  onSave: (id: string, origins: string[]) => Promise<{ error?: string } | undefined>
}

export function AllowedOriginsEditor({
  resourceId,
  initialOrigins,
  onSave,
}: AllowedOriginsEditorProps) {
  const [value, setValue] = useState((initialOrigins ?? ['*']).join('\n'))
  const [pending, setPending] = useState(false)

  const isDirty = value !== (initialOrigins ?? ['*']).join('\n')

  async function handleSave() {
    const origins = value
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    setPending(true)
    const result = await onSave(resourceId, origins.length ? origins : ['*'])
    setPending(false)

    if (result?.error) {
      sileo.error({ title: result.error })
    } else {
      sileo.success({ title: 'Allowed origins saved' })
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder={'*\nhttps://example.com\n*.example.com'}
        className="font-mono text-xs resize-none"
        spellCheck={false}
      />
      <p className="text-xs text-muted-foreground leading-relaxed">
        One entry per line.{' '}
        <code className="bg-muted px-1 rounded">*</code> allows all sites.
        Supports{' '}
        <code className="bg-muted px-1 rounded">https://example.com</code> and{' '}
        <code className="bg-muted px-1 rounded">*.example.com</code>.
      </p>
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        disabled={pending || !isDirty}
        onClick={handleSave}
      >
        {pending ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <ShieldCheck className="mr-2 h-3.5 w-3.5" />
        )}
        Save origins
      </Button>
    </div>
  )
}
