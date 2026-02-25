import { Skeleton } from '@/components/ui/skeleton'

export default function ExperimentDetailLoading() {
  return (
    <div>
      {/* Header */}
      <div className="flex h-14 items-center gap-3 border-b px-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Two-column grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Scripts card */}
          <div className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-5 w-24" />
            <div className="rounded-md border p-3 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="rounded-md border p-3 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>

          {/* Config column */}
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-full rounded-full" />
            </div>
            <div className="rounded-lg border p-4 space-y-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
