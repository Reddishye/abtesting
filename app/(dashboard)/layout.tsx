import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/queries/auth'
import { adminClient } from '@/lib/supabase/admin'
import { unstable_cache } from 'next/cache'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

function getOrg(orgId: string) {
  return unstable_cache(
    async () => {
      const { data } = await adminClient
        .from('orgs')
        .select('name, slug')
        .eq('id', orgId)
        .single()
      return data
    },
    [`org:${orgId}`],
    { tags: [`org:${orgId}`] }
  )()
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile(user.id)
  if (!profile) redirect('/onboarding')

  const org = await getOrg(profile.org_id)

  return (
    <SidebarProvider>
      <AppSidebar
        email={profile.email ?? user.email ?? null}
        orgName={org?.name ?? 'My Organization'}
      />
      <SidebarInset className="overflow-hidden">{children}</SidebarInset>
    </SidebarProvider>
  )
}
