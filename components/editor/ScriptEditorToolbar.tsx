'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { saveDraft } from '@/lib/actions/scripts'
import { PublishDialog } from '@/components/scripts/PublishDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { CopyButton } from '@/components/shared/CopyButton'
import { buildScriptUrl } from '@/lib/utils/script-url'
import { Check, Loader2, Save } from 'lucide-react'
import { sileo } from 'sileo'
import type { ScriptStatus } from '@/lib/types/database.types'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface ScriptEditorToolbarProps {
  scriptId: string
  initialName: string
  status: ScriptStatus
  code: string
}

export function ScriptEditorToolbar({
  scriptId,
  initialName,
  status,
  code,
}: ScriptEditorToolbarProps) {
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const codeRef = useRef(code)
  const isDraft = status === 'draft'
  const publicUrl = buildScriptUrl(scriptId)

  // Keep codeRef in sync (MonacoEditor updates parent state)
  useEffect(() => {
    codeRef.current = code
  }, [code])

  const save = useCallback(async () => {
    setSaving(true)
    const result = await saveDraft({
      id: scriptId,
      name,
      code: codeRef.current,
    })

    setSaving(false)

    if (result?.error) {
      sileo.error({ title: result.error })
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }, [scriptId, name])

  // Debounced auto-save on code change
  useEffect(() => {
    if (!isDraft) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      save()
    }, 2000)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [code, save, isDraft])

  return (
    <div className="flex items-center gap-2 border-b bg-background px-4 py-2 h-14 shrink-0 overflow-hidden">
      <Button variant="ghost" size="sm" asChild className="-ml-2 shrink-0">
        <Link href="/scripts">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Scripts</span>
        </Link>
      </Button>

      <div className="h-4 w-px bg-border shrink-0" />

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={!isDraft}
        className="h-8 w-28 sm:w-44 lg:w-56 text-sm min-w-0"
        placeholder="Script name"
      />

      <StatusBadge status={status} />

      <div className="flex-1 min-w-0" />

      {!isDraft && (
        <div className="hidden sm:flex items-center gap-2 min-w-0">
          <span className="text-xs text-muted-foreground font-mono truncate max-w-40 lg:max-w-xs">
            {publicUrl}
          </span>
          <CopyButton text={publicUrl} />
        </div>
      )}

      {isDraft && (
        <>
          <span className="hidden md:flex text-xs text-muted-foreground items-center gap-1 shrink-0">
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving…
              </>
            ) : saved ? (
              <span className="flex items-center gap-1 text-green-500">
                <Check className="h-3 w-3" />
                Saved
              </span>
            ) : (
              'Auto-saves after 2s'
            )}
          </span>

          <Button variant="outline" size="sm" onClick={save} disabled={saving} className="shrink-0">
            <Save className="mr-2 h-3.5 w-3.5" />
            Save
          </Button>

          <PublishDialog scriptId={scriptId} />
        </>
      )}
    </div>
  )
}
