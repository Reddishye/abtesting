import { Badge } from '@/components/ui/badge'
import type { ScriptStatus, ExperimentStatus } from '@/lib/types/database.types'

type Status = ScriptStatus | ExperimentStatus

const config: Record<Status, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  published: { label: 'Published', variant: 'default' },
  archived: { label: 'Archived', variant: 'outline' },
  running: { label: 'Running', variant: 'default' },
  paused: { label: 'Paused', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'outline' },
}

interface StatusBadgeProps {
  status: Status
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, variant } = config[status] ?? { label: status, variant: 'outline' }
  return <Badge variant={variant}>{label}</Badge>
}
