'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScriptTable } from '@/components/scripts/ScriptTable'
import type { ExperimentRow, ScriptRow } from '@/lib/types/database.types'
import { Search } from 'lucide-react'

interface ScriptListSearchProps {
  scripts: ScriptRow[]
  experiments: ExperimentRow[]
}

export function ScriptListSearch({ scripts, experiments }: ScriptListSearchProps) {
  const [query, setQuery] = useState('')

  const activeScripts = useMemo(
    () => scripts.filter((s) => s.status !== 'archived'),
    [scripts]
  )
  const archivedScripts = useMemo(
    () => scripts.filter((s) => s.status === 'archived'),
    [scripts]
  )

  function filterScripts(list: ScriptRow[]) {
    if (!query.trim()) return list
    const q = query.toLowerCase()
    return list.filter((script) => {
      if ((script.name ?? '').toLowerCase().includes(q)) return true
      return experiments.some(
        (exp) =>
          (exp.script_a === script.id || exp.script_b === script.id) &&
          (exp.name ?? '').toLowerCase().includes(q)
      )
    })
  }

  const filteredActive = useMemo(
    () => filterScripts(activeScripts),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeScripts, query]
  )
  const filteredArchived = useMemo(
    () => filterScripts(archivedScripts),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [archivedScripts, query]
  )

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name or experiment…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active
            {activeScripts.length > 0 && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
                {activeScripts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived
            {archivedScripts.length > 0 && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
                {archivedScripts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <div className="rounded-lg border">
            {filteredActive.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {query.trim() ? `No scripts match "${query}"` : 'No active scripts.'}
              </p>
            ) : (
              <ScriptTable scripts={filteredActive} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          <div className="rounded-lg border">
            {filteredArchived.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {query.trim()
                  ? `No archived scripts match "${query}"`
                  : 'No archived scripts.'}
              </p>
            ) : (
              <ScriptTable scripts={filteredArchived} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
