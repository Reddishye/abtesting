import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/queries/auth'
import { getScriptsByOrg } from '@/lib/queries/scripts'
import { getExperimentsByOrg } from '@/lib/queries/experiments'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { ScriptListSearch } from '@/components/scripts/ScriptListSearch'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Code2, Plus } from 'lucide-react'

export default async function ScriptsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile(user.id)
  if (!profile) redirect('/onboarding')

  const [scripts, experiments] = await Promise.all([
    getScriptsByOrg(profile.org_id),
    getExperimentsByOrg(profile.org_id),
  ])

  return (
    <>
      <DashboardHeader title="Scripts">
        <Button asChild size="sm">
          <Link href="/scripts/new">
            <Plus className="mr-2 h-4 w-4" />
            New Script
          </Link>
        </Button>
      </DashboardHeader>

      <main className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
        {scripts.length === 0 ? (
          <EmptyState
            icon={Code2}
            title="No scripts yet"
            description="Write your first JavaScript snippet and inject it into any website."
            action={{ label: 'Create script', href: '/scripts/new' }}
          />
        ) : (
          <ScriptListSearch scripts={scripts} experiments={experiments} />
        )}
      </main>
    </>
  )
}
