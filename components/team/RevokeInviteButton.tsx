'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { revokeInvite } from '@/lib/actions/team'

export function RevokeInviteButton({ inviteId }: { inviteId: string }) {
  const [pending, setPending] = useState(false)

  async function handleRevoke() {
    if (!confirm('Revoke this invite? The link will stop working immediately.')) return
    setPending(true)
    await revokeInvite(inviteId)
    // revalidatePath in the action re-renders the server component
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-destructive"
      disabled={pending}
      onClick={handleRevoke}
    >
      {pending
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <Trash2 className="h-3.5 w-3.5" />
      }
    </Button>
  )
}
