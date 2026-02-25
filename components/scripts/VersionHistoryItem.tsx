import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import type { ScriptRow } from '@/lib/types/database.types'
import { GitBranch } from 'lucide-react'

interface VersionHistoryItemProps {
  script: ScriptRow
  isCurrent?: boolean
}

export function VersionHistoryItem({
  script,
  isCurrent,
}: VersionHistoryItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <div className="flex items-center gap-2 shrink-0">
        <GitBranch className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-mono font-medium">v{script.version}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {script.name ?? 'Untitled'}
          </span>
          {isCurrent && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              current
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(script.created_at), { addSuffix: true })}
        </p>
      </div>

      <StatusBadge status={script.status} />

      <Button variant="outline" size="sm" asChild>
        <Link href={`/scripts/${script.id}`}>View</Link>
      </Button>
    </div>
  )
}
