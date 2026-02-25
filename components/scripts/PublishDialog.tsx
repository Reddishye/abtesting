'use client'

import { useState } from 'react'
import { publishScript } from '@/lib/actions/scripts'
import { buildScriptUrl } from '@/lib/utils/script-url'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CopyButton } from '@/components/shared/CopyButton'
import { CheckCircle2, Globe, Loader2, Upload } from 'lucide-react'
import { sileo } from 'sileo'

interface PublishDialogProps {
  scriptId: string
  disabled?: boolean
}

export function PublishDialog({ scriptId, disabled }: PublishDialogProps) {
  const [open, setOpen] = useState(false)
  const [published, setPublished] = useState(false)
  const [pending, setPending] = useState(false)
  const publicUrl = buildScriptUrl(scriptId)

  async function handlePublish() {
    setPending(true)
    const result = await publishScript(scriptId)

    if (result?.error) {
      sileo.error({ title: result.error })
      setPending(false)
      return
    }

    setPublished(true)
    setPending(false)
    sileo.success({ title: 'Script published' })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Publish
        </Button>
      </DialogTrigger>

      <DialogContent>
        {!published ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Publish script
              </DialogTitle>
              <DialogDescription>
                Once published, this script will be accessible via a public URL.
                Published scripts are immutable — to edit, you will create a new
                version.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Publishing will make this script available to anyone with the URL,
              on any domain, without authentication.
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePublish} disabled={pending}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm publish
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                Script published!
              </DialogTitle>
              <DialogDescription>
                Your script is now live. Inject it into any page using the
                script tag below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Public URL</Label>
                <div className="flex gap-2">
                  <Input readOnly value={publicUrl} className="font-mono text-xs" />
                  <CopyButton text={publicUrl} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Script tag</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`<script src="${publicUrl}" async></script>`}
                    className="font-mono text-xs"
                  />
                  <CopyButton
                    text={`<script src="${publicUrl}" async></script>`}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
