import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/queries/auth'
import { getMembersByOrg, getInvitesByOrg } from '@/lib/queries/team'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { MemberTable } from '@/components/team/MemberTable'
import { InviteForm } from '@/components/team/InviteForm'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Users, Mail } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { UserRole } from '@/lib/types/database.types'
import { RevokeInviteButton } from '@/components/team/RevokeInviteButton'

export default async function TeamPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile(user.id)
  if (!profile) redirect('/onboarding')

  const [members, pendingInvites] = await Promise.all([
    getMembersByOrg(profile.org_id),
    getInvitesByOrg(profile.org_id),
  ])

  const canManage = (['owner', 'admin'] as UserRole[]).includes(profile.role)

  return (
    <>
      <DashboardHeader title="Team" />

      <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-3xl overflow-y-auto">
        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members
            </CardTitle>
            <CardDescription>
              People with access to this organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberTable
              members={members}
              currentUserId={user.id}
              currentUserRole={profile.role}
            />
          </CardContent>
        </Card>

        {/* Pending invites */}
        {pendingInvites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Pending invites
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires{' '}
                      {invite.expires_at
                        ? formatDistanceToNow(new Date(invite.expires_at), {
                            addSuffix: true,
                          })
                        : 'soon'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{invite.role}</Badge>
                    {canManage && <RevokeInviteButton inviteId={invite.id} />}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Invite form */}
        {canManage && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Invite a member
              </CardTitle>
              <CardDescription>
                Invites expire after 7 days. The invitee will need to sign up
                with the same email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteForm />
            </CardContent>
          </Card>
        )}
      </main>
    </>
  )
}
