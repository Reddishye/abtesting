import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/queries/auth'
import { getExperimentsByOrg } from '@/lib/queries/experiments'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { ExperimentListSearch } from '@/components/experiments/ExperimentListSearch'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FlaskConical, Plus } from 'lucide-react'

export default async function ExperimentsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile(user.id)
  if (!profile) redirect('/onboarding')

  const experiments = await getExperimentsByOrg(profile.org_id)

  return (
    <>
      <DashboardHeader title="Experiments">
        <Button asChild size="sm">
          <Link href="/experiments/new">
            <Plus className="mr-2 h-4 w-4" />
            New Experiment
          </Link>
        </Button>
      </DashboardHeader>

      <main className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
        {experiments.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No experiments yet"
            description="Create an A/B experiment to serve different scripts to different visitors."
            action={{ label: 'Create experiment', href: '/experiments/new' }}
          />
        ) : (
          <ExperimentListSearch experiments={experiments} />
        )}
      </main>
    </>
  )
}
