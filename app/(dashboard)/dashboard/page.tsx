import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/queries/auth'
import { adminClient } from '@/lib/supabase/admin'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Code2, FlaskConical, FileText, Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile(user.id)
  if (!profile) redirect('/onboarding')

  const [{ count: scriptCount }, { count: experimentCount }, { count: memberCount }] =
    await Promise.all([
      adminClient
        .from('scripts')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', profile.org_id),
      adminClient
        .from('experiments')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', profile.org_id),
      adminClient
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', profile.org_id),
    ])

  const stats = [
    {
      title: 'Total Scripts',
      value: scriptCount ?? 0,
      description: 'JavaScript snippets',
      icon: Code2,
      href: '/scripts',
    },
    {
      title: 'Experiments',
      value: experimentCount ?? 0,
      description: 'A/B test configurations',
      icon: FlaskConical,
      href: '/experiments',
    },
    {
      title: 'Team members',
      value: memberCount ?? 0,
      description: 'Collaborators',
      icon: Users,
      href: '/team',
    },
  ]

  return (
    <>
      <DashboardHeader title="Dashboard">
        <Button asChild size="sm">
          <Link href="/scripts/new">
            <Code2 className="mr-2 h-4 w-4" />
            New Script
          </Link>
        </Button>
      </DashboardHeader>

      <main className="flex-1 space-y-6 p-6 overflow-y-auto">
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Link href={stat.href} key={stat.title} className="group">
              <Card className="transition-colors group-hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {(scriptCount ?? 0) === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Quick start
              </CardTitle>
              <CardDescription>
                Inject JavaScript into any website in three steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    1
                  </span>
                  <div>
                    <p className="font-medium">Write a script</p>
                    <p className="text-muted-foreground">
                      Open the editor and write any JavaScript that modifies the
                      target page.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    2
                  </span>
                  <div>
                    <p className="font-medium">Publish it</p>
                    <p className="text-muted-foreground">
                      Hit Publish to get a unique, immutable public URL for your
                      script.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    3
                  </span>
                  <div>
                    <p className="font-medium">Inject it anywhere</p>
                    <p className="text-muted-foreground">
                      Add{' '}
                      <code className="font-mono bg-muted px-1 py-0.5 rounded text-xs">
                        {'<script src="/p/{id}.js"></script>'}
                      </code>{' '}
                      to any page.
                    </p>
                  </div>
                </li>
              </ol>

              <div className="pt-2">
                <Button asChild>
                  <Link href="/scripts/new">Create your first script</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Catch up on latest changes
              </CardTitle>
              <CardDescription>
                Pick up where you left off
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" className="justify-start h-auto py-3" asChild>
                  <Link href="/scripts/new">
                    <Code2 className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="text-left">
                      <p className="font-medium text-sm">New script</p>
                      <p className="text-xs text-muted-foreground">Write a new JS snippet</p>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3" asChild>
                  <Link href="/scripts">
                    <Code2 className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="text-left">
                      <p className="font-medium text-sm">Browse scripts</p>
                      <p className="text-xs text-muted-foreground">
                        {scriptCount} script{scriptCount === 1 ? '' : 's'} in your org
                      </p>
                    </div>
                  </Link>
                </Button>
                {(scriptCount ?? 0) >= 2 && (
                  <Button variant="outline" className="justify-start h-auto py-3" asChild>
                    <Link href="/experiments/new">
                      <FlaskConical className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="text-left">
                        <p className="font-medium text-sm">New experiment</p>
                        <p className="text-xs text-muted-foreground">Run an A/B test</p>
                      </div>
                    </Link>
                  </Button>
                )}
                {(memberCount ?? 0) <= 1 && (
                  <Button variant="outline" className="justify-start h-auto py-3" asChild>
                    <Link href="/team">
                      <Users className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Invite a teammate</p>
                        <p className="text-xs text-muted-foreground">Collaborate with your team</p>
                      </div>
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  )
}
