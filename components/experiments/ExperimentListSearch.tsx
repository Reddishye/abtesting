'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExperimentCard } from '@/components/experiments/ExperimentCard'
import type { ExperimentRow } from '@/lib/types/database.types'
import { Search } from 'lucide-react'

interface ExperimentListSearchProps {
  experiments: ExperimentRow[]
}

export function ExperimentListSearch({ experiments }: ExperimentListSearchProps) {
  const [query, setQuery] = useState('')

  const activeExperiments = useMemo(
    () => experiments.filter((e) => e.status !== 'archived'),
    [experiments]
  )
  const archivedExperiments = useMemo(
    () => experiments.filter((e) => e.status === 'archived'),
    [experiments]
  )

  function filterExperiments(list: ExperimentRow[]) {
    if (!query.trim()) return list
    const q = query.toLowerCase()
    return list.filter((exp) => (exp.name ?? '').toLowerCase().includes(q))
  }

  const filteredActive = useMemo(
    () => filterExperiments(activeExperiments),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeExperiments, query]
  )
  const filteredArchived = useMemo(
    () => filterExperiments(archivedExperiments),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [archivedExperiments, query]
  )

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search experiments…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active
            {activeExperiments.length > 0 && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
                {activeExperiments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived
            {archivedExperiments.length > 0 && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
                {archivedExperiments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {filteredActive.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {query.trim() ? `No experiments match "${query}"` : 'No active experiments.'}
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredActive.map((exp) => (
                <ExperimentCard key={exp.id} experiment={exp} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          {filteredArchived.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {query.trim()
                ? `No archived experiments match "${query}"`
                : 'No archived experiments.'}
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredArchived.map((exp) => (
                <ExperimentCard key={exp.id} experiment={exp} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
