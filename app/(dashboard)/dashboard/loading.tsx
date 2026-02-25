import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div>
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Skeleton className="h-5 w-24" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-lg" />
      </div>
    </div>
  )
}
