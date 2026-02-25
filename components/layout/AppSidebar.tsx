'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { SidebarUserMenu } from '@/components/layout/SidebarUserMenu'
import {
  Code2,
  FlaskConical,
  LayoutDashboard,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const navItems = [
  {
    label: 'Platform',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Scripts', href: '/scripts', icon: Code2 },
      { title: 'Experiments', href: '/experiments', icon: FlaskConical },
    ],
  },
  {
    label: 'Organization',
    items: [
      { title: 'Team', href: '/team', icon: Users },
    ],
  },
]

interface AppSidebarProps {
  email: string | null
  orgName: string
}

export function AppSidebar({ email, orgName }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    navItems.flatMap((g) => g.items).forEach((item) => {
      router.prefetch(item.href)
    })
  }, [router])

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-xs font-bold">AB</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{orgName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    A/B Testing Platform
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navItems.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname.startsWith(item.href)

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon
                            className={cn(
                              'h-4 w-4',
                              isActive
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            )}
                          />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarUserMenu email={email} orgName={orgName} />
      </SidebarFooter>
    </Sidebar>
  )
}
