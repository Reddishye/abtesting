import { Skeleton } from '@/components/ui/skeleton'

export default function ScriptDetailLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-4 h-14 shrink-0">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-44" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Editor + panel */}
      <div className="flex flex-1 overflow-hidden">
        <Skeleton className="flex-1 rounded-none" />
      </div>
    </div>
  )
}
