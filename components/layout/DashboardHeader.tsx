import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

interface DashboardHeaderProps {
  title: string
  children?: React.ReactNode
}

export function DashboardHeader({ title, children }: DashboardHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="text-sm font-semibold flex-1">{title}</h1>
      {children}
    </header>
  )
}
