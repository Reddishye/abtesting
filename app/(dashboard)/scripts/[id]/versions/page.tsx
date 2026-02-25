import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/queries/auth'
import { getVersionHistory } from '@/lib/queries/scripts'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { VersionHistoryItem } from '@/components/scripts/VersionHistoryItem'
import { EmptyState } from '@/components/shared/EmptyState'
import { GitBranch } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function VersionHistoryPage({ params }: Props) {
  const { id } = await params

  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile(user.id)
  if (!profile) redirect('/onboarding')

  const versions = await getVersionHistory(id, profile.org_id)

  return (
    <>
      <DashboardHeader title="Version history" />

      <main className="flex-1 p-4 sm:p-6 max-w-2xl overflow-y-auto">
        {versions.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No versions found"
            description="Version history will appear here once you create and publish scripts."
          />
        ) : (
          <div className="space-y-3">
            {versions.map((version, index) => (
              <VersionHistoryItem
                key={version.id}
                script={version}
                isCurrent={version.id === id || index === versions.length - 1}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
