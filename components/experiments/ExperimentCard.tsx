import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import type { ExperimentRow } from '@/lib/types/database.types'
import { ArrowRight, FlaskConical } from 'lucide-react'

interface ExperimentCardProps {
  experiment: ExperimentRow
}

export function ExperimentCard({ experiment }: ExperimentCardProps) {
  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <FlaskConical className="h-4 w-4 text-muted-foreground shrink-0" />
            <CardTitle className="text-base truncate">
              {experiment.name ?? 'Untitled experiment'}
            </CardTitle>
          </div>
          <StatusBadge status={experiment.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-sm">
            <p className="text-muted-foreground text-xs mb-1">Variant A</p>
            <div className="h-2 rounded bg-blue-500/20 w-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded"
                style={{ width: `${experiment.weights.a}%` }}
              />
            </div>
            <p className="text-xs font-mono mt-1">{experiment.weights.a}%</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground text-xs mb-1">Variant B</p>
            <div className="h-2 rounded bg-purple-500/20 w-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded"
                style={{ width: `${experiment.weights.b}%` }}
              />
            </div>
            <p className="text-xs font-mono mt-1">{experiment.weights.b}%</p>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/experiments/${experiment.id}`}>
            View details
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
