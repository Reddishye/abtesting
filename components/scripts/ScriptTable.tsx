'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ArchiveDialog } from '@/components/shared/ArchiveDialog'
import { archiveScript } from '@/lib/actions/scripts'
import type { ScriptRow } from '@/lib/types/database.types'
import { Archive, Code2, ExternalLink, MoreHorizontal } from 'lucide-react'

interface ScriptTableProps {
  scripts: ScriptRow[]
}

export function ScriptTable({ scripts }: ScriptTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Version</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Published</TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {scripts.map((script) => (
          <TableRow key={script.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <Link
                  href={`/scripts/${script.id}`}
                  className="font-medium hover:underline underline-offset-4 truncate max-w-50"
                >
                  {script.name ?? 'Untitled'}
                </Link>
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge status={script.status} />
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              v{script.version}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {formatDistanceToNow(new Date(script.created_at), {
                addSuffix: true,
              })}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {script.published_at
                ? formatDistanceToNow(new Date(script.published_at), {
                    addSuffix: true,
                  })
                : '—'}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/scripts/${script.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>

                {script.status !== 'archived' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <ArchiveDialog
                        itemType="script"
                        onConfirm={() => archiveScript(script.id)}
                        trigger={
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive focus:text-destructive cursor-pointer"
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        }
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
