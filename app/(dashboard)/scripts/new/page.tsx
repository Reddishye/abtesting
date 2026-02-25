'use client'

import { useState } from 'react'
import { createScript } from '@/lib/actions/scripts'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { MonacoEditor } from '@/components/editor/MonacoEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus } from 'lucide-react'
import { sileo } from 'sileo'

const DEFAULT_CODE = `(function () {
  // Your script runs in the context of the host page.
  // Example: change the background color
  // document.body.style.backgroundColor = '#f0f4ff';

  console.log('[ABPlatform] Script loaded');
})();
`

export default function NewScriptPage() {
  const [name, setName] = useState('Untitled script')
  const [code, setCode] = useState(DEFAULT_CODE)
  const [pending, setPending] = useState(false)

  async function handleCreate() {
    setPending(true)

    const formData = new FormData()
    formData.set('name', name)
    formData.set('code', code)

    const result = await createScript(formData)

    if (result?.error) {
      sileo.error({ title: result.error })
      setPending(false)
    }
    // On success, createScript redirects to /scripts/{id}
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="New script">
        <div className="flex items-center gap-3 min-w-0">
          <Label htmlFor="script-name" className="sr-only">
            Script name
          </Label>
          <Input
            id="script-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 w-32 sm:w-44 lg:w-56 text-sm min-w-0"
            placeholder="Script name"
          />
          <Button size="sm" onClick={handleCreate} disabled={pending}>
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create
          </Button>
        </div>
      </DashboardHeader>

      <div className="flex-1 overflow-hidden">
        <MonacoEditor value={code} onChange={setCode} />
      </div>
    </div>
  )
}
