import { Skeleton } from '@/components/ui/skeleton'

export default function ExperimentsLoading() {
  return (
    <div>
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Skeleton className="h-5 w-32" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
