'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { MonacoEditor } from '@/components/editor/MonacoEditor'
import { ScriptEditorToolbar } from '@/components/editor/ScriptEditorToolbar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { archiveScript, forkScript, updateScriptAllowedOrigins } from '@/lib/actions/scripts'
import { AllowedOriginsEditor } from '@/components/shared/AllowedOriginsEditor'
import type { UserRole } from '@/lib/types/database.types'
import { buildScriptUrl } from '@/lib/utils/script-url'
import { CopyButton } from '@/components/shared/CopyButton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDistanceToNow, format } from 'date-fns'
import { Archive, GitBranch, Globe, History } from 'lucide-react'
import Link from 'next/link'
import { sileo } from 'sileo'
import type { ScriptRow } from '@/lib/types/database.types'
import { ArchiveDialog } from '@/components/shared/ArchiveDialog'

export default function ScriptEditorPage() {
  const { id } = useParams<{ id: string }>()
  const [script, setScript] = useState<ScriptRow | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [forking, setForking] = useState(false)
  const isFirstLoad = useRef(true)

  useEffect(() => {
    fetch(`/api/scripts/${id}`)
      .then((r) => r.json())
      .then((data: { script: ScriptRow; role: UserRole }) => {
        setScript(data.script)
        setRole(data.role)
        setCode(data.script.code)
        setLoading(false)
      })
      .catch(() => {
        sileo.error({ title: 'Failed to load script' })
        setLoading(false)
      })
  }, [id])

  // Sync external code changes back to toolbar ref
  function handleCodeChange(value: string) {
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      return
    }
    setCode(value)
  }

  async function handleFork() {
    setForking(true)
    try {
      const result = await forkScript(id)
      if (result?.error) {
        sileo.error({ title: result.error })
        setForking(false)
      }
    } catch (err: unknown) {
      if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) return
      sileo.error({ title: 'An unexpected error occurred.' })
      setForking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Skeleton className="h-14 w-full rounded-none" />
        <Skeleton className="flex-1 rounded-none" />
      </div>
    )
  }

  if (!script) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Script not found.</p>
      </div>
    )
  }

  const publicUrl = buildScriptUrl(script.id)
  const isPublished = script.status === 'published'
  const isArchived = script.status === 'archived'
  const isEditable = script.status === 'draft'
  const canManageOrigins = role !== null && ['owner', 'admin'].includes(role)

  return (
    <div className="flex flex-col h-full">
      <ScriptEditorToolbar
        scriptId={script.id}
        initialName={script.name ?? 'Untitled'}
        status={script.status}
        code={code}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <MonacoEditor
            value={code}
            onChange={handleCodeChange}
            readOnly={!isEditable}
          />
        </div>

        {/* Info Panel */}
        <div className="hidden lg:flex flex-col w-72 border-l bg-muted/20 overflow-y-auto p-4 space-y-4 shrink-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Script info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={script.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="font-mono font-medium">v{script.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="text-xs">
                  {format(new Date(script.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              {script.published_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Published</span>
                  <span className="text-xs">
                    {formatDistanceToNow(new Date(script.published_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {isPublished && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Public URL
                </CardTitle>
                <CardDescription className="text-xs">
                  Inject this script into any page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
                    {publicUrl}
                  </code>
                  <CopyButton text={publicUrl} className="shrink-0" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Script tag</p>
                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded block break-all">
                    {`<script src="${publicUrl}" async></script>`}
                  </code>
                  <CopyButton
                    text={`<script src="${publicUrl}" async></script>`}
                    className="w-full justify-center mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {isPublished && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  New version
                </CardTitle>
                <CardDescription className="text-xs">
                  Create an editable draft based on this version
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={handleFork}
                  disabled={forking}
                >
                  {forking ? 'Creating…' : 'Edit → New version'}
                </Button>
              </CardContent>
            </Card>
          )}

          {isArchived && (
            <div className="text-sm text-muted-foreground text-center py-4">
              This script is archived and read-only.
            </div>
          )}

          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href={`/scripts/${script.id}/versions`}>
              <History className="mr-2 h-4 w-4" />
              Version history
            </Link>
          </Button>

          {canManageOrigins && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Allowed origins</CardTitle>
                <CardDescription className="text-xs">
                  Restrict which sites can load this script
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AllowedOriginsEditor
                  resourceId={script.id}
                  initialOrigins={script.allowed_origins ?? ['*']}
                  onSave={updateScriptAllowedOrigins}
                />
              </CardContent>
            </Card>
          )}

          {!isArchived && (
            <ArchiveDialog
              itemType="script"
              onConfirm={() => archiveScript(script.id)}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-destructive"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive script
                </Button>
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}
