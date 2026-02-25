import { Skeleton } from '@/components/ui/skeleton'

export default function ScriptsLoading() {
  return (
    <div>
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Skeleton className="h-5 w-24" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="p-6">
        <div className="rounded-lg border divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <div className="flex-1" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
