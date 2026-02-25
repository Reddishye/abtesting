'use client'

import { useState } from 'react'
import { archiveExperiment, setExperimentStatus } from '@/lib/actions/experiments'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArchiveDialog } from '@/components/shared/ArchiveDialog'
import type { ExperimentStatus } from '@/lib/types/database.types'
import { Archive, FlaskConical, Loader2, Pause, Play, Square } from 'lucide-react'
import { sileo } from 'sileo'

interface ExperimentStatusControlProps {
  experimentId: string
  currentStatus: ExperimentStatus
}

export function ExperimentStatusControl({
  experimentId,
  currentStatus,
}: ExperimentStatusControlProps) {
  const [pending, setPending] = useState(false)

  async function handleStatusChange(status: ExperimentStatus) {
    setPending(true)
    const result = await setExperimentStatus(experimentId, status)

    if (result?.error) {
      sileo.error({ title: result.error })
    } else {
      sileo.success({ title: `Experiment ${status}` })
    }
    setPending(false)
  }

  if (currentStatus === 'archived') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Status control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-1">
            This experiment is archived.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FlaskConical className="h-4 w-4" />
          Status control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {currentStatus === 'draft' && (
            <Button
              size="sm"
              onClick={() => handleStatusChange('running')}
              disabled={pending}
              className="flex-1"
            >
              {pending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Start
            </Button>
          )}

          {currentStatus === 'running' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('paused')}
                disabled={pending}
                className="flex-1"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('completed')}
                disabled={pending}
                className="flex-1"
              >
                <Square className="mr-2 h-4 w-4" />
                End
              </Button>
            </>
          )}

          {currentStatus === 'paused' && (
            <>
              <Button
                size="sm"
                onClick={() => handleStatusChange('running')}
                disabled={pending}
                className="flex-1"
              >
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('completed')}
                disabled={pending}
                className="flex-1"
              >
                <Square className="mr-2 h-4 w-4" />
                End
              </Button>
            </>
          )}

          {currentStatus === 'completed' && (
            <p className="text-sm text-muted-foreground text-center w-full py-1">
              This experiment has ended.
            </p>
          )}
        </div>

        <ArchiveDialog
          itemType="experiment"
          onConfirm={() => archiveExperiment(experimentId)}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-destructive"
              disabled={pending}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive experiment
            </Button>
          }
        />
      </CardContent>
    </Card>
  )
}
