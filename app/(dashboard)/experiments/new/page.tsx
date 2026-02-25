import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/queries/auth'
import { getScriptsByOrg } from '@/lib/queries/scripts'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { CreateExperimentForm } from '@/components/experiments/CreateExperimentForm'
import type { ScriptRow } from '@/lib/types/database.types'

export default async function NewExperimentPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile(user.id)
  if (!profile) redirect('/onboarding')

  const scripts = await getScriptsByOrg(profile.org_id)
  const publishedScripts = scripts.filter((s) => s.status === 'published') as ScriptRow[]

  return (
    <>
      <DashboardHeader title="New experiment" />
      <main className="flex-1 p-4 sm:p-6 max-w-2xl overflow-y-auto">
        <CreateExperimentForm publishedScripts={publishedScripts} />
      </main>
    </>
  )
}
