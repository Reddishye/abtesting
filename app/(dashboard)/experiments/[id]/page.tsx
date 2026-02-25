import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/queries/auth'
import {
  getExperimentById,
  getExperimentStats,
} from '@/lib/queries/experiments'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { CopyButton } from '@/components/shared/CopyButton'
import { WeightSlider } from '@/components/experiments/WeightSlider'
import { ExperimentStatusControl } from '@/components/experiments/ExperimentStatusControl'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { buildExperimentUrl } from '@/lib/utils/script-url'
import { AllowedOriginsEditor } from '@/components/shared/AllowedOriginsEditor'
import { updateExperimentAllowedOrigins } from '@/lib/actions/experiments'
import { Code2, FlaskConical, Globe, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ExperimentDetailPage({ params }: Props) {
  const { id } = await params

  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile(user.id)
  if (!profile) redirect('/onboarding')

  const [experiment, stats] = await Promise.all([
    getExperimentById(id, profile.org_id),
    getExperimentStats(id),
  ])

  const canManage = ['owner', 'admin'].includes(profile.role)

  if (!experiment) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Experiment not found.
      </div>
    )
  }

  const publicUrl = buildExperimentUrl(experiment.id)
  const scriptTag = `<script src="${publicUrl}" async></script>`

  return (
    <>
      <DashboardHeader title={experiment.name ?? 'Experiment'}>
        <StatusBadge status={experiment.status} />
      </DashboardHeader>

      <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-4xl overflow-y-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Total impressions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-500">Variant A</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats.variant_a_impressions}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0
                  ? `${Math.round((stats.variant_a_impressions / stats.total) * 100)}% of traffic`
                  : 'No data yet'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-500">
                Variant B
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats.variant_b_impressions}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0
                  ? `${Math.round((stats.variant_b_impressions / stats.total) * 100)}% of traffic`
                  : 'No data yet'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Scripts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Scripts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-md border bg-blue-50 dark:bg-blue-950/20">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                  Variant A ({experiment.weights.a}%)
                </p>
                <p className="text-sm font-medium">
                  {experiment.script_a_data?.name ?? 'Unknown script'}
                </p>
                <p className="text-xs text-muted-foreground">
                  v{experiment.script_a_data?.version} ·{' '}
                  {experiment.script_a_data?.status}
                </p>
                {experiment.script_a && (
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 h-auto text-xs mt-1"
                    asChild
                  >
                    <Link href={`/scripts/${experiment.script_a}`}>
                      Open script
                    </Link>
                  </Button>
                )}
              </div>

              <div className="p-3 rounded-md border bg-purple-50 dark:bg-purple-950/20">
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                  Variant B ({experiment.weights.b}%)
                </p>
                <p className="text-sm font-medium">
                  {experiment.script_b_data?.name ?? 'Unknown script'}
                </p>
                <p className="text-xs text-muted-foreground">
                  v{experiment.script_b_data?.version} ·{' '}
                  {experiment.script_b_data?.status}
                </p>
                {experiment.script_b && (
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 h-auto text-xs mt-1"
                    asChild
                  >
                    <Link href={`/scripts/${experiment.script_b}`}>
                      Open script
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Config */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Traffic split</CardTitle>
                <CardDescription>
                  How traffic is distributed between variants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WeightSlider
                  initialA={experiment.weights.a}
                  initialB={experiment.weights.b}
                  readOnly
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Experiment URL
                </CardTitle>
                <CardDescription>
                  This URL serves variant A or B based on weights and visitor
                  stickiness
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-muted px-2 py-1.5 rounded flex-1 truncate">
                    {publicUrl}
                  </code>
                  <CopyButton text={publicUrl} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Script tag
                  </p>
                  <code className="text-xs font-mono bg-muted px-2 py-1.5 rounded block break-all">
                    {scriptTag}
                  </code>
                  <CopyButton
                    text={scriptTag}
                    className="w-full justify-center mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <ExperimentStatusControl
              experimentId={experiment.id}
              currentStatus={experiment.status}
            />

            {canManage && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Allowed origins
                  </CardTitle>
                  <CardDescription>
                    Restrict which sites can load this experiment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AllowedOriginsEditor
                    resourceId={experiment.id}
                    initialOrigins={experiment.allowed_origins ?? ['*']}
                    onSave={updateExperimentAllowedOrigins}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
