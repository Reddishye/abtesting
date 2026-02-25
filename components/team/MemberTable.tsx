'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { removeMember, updateMemberRole } from '@/lib/actions/team'
import type { UserRole, UserRow } from '@/lib/types/database.types'
import { Crown, Eye, MoreHorizontal, Pencil, Shield, Trash2, UserCog } from 'lucide-react'
import { sileo } from 'sileo'

const roleIcon: Record<UserRole, React.ElementType> = {
  owner: Crown,
  admin: Shield,
  editor: Pencil,
  viewer: Eye,
}

const roleBadgeClass: Record<UserRole, string> = {
  owner:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300',
  admin:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  editor:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  viewer:
    'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
}

interface MemberTableProps {
  members: UserRow[]
  currentUserId: string
  currentUserRole: UserRole
}

export function MemberTable({
  members,
  currentUserId,
  currentUserRole,
}: MemberTableProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const canManage = ['owner', 'admin'].includes(currentUserRole)
  const isOwner = currentUserRole === 'owner'

  async function handleRemove(userId: string) {
    setLoading(userId)
    const result = await removeMember(userId)
    if (result?.error) sileo.error({ title: result.error })
    else sileo.success({ title: 'Member removed' })
    setLoading(null)
  }

  async function handleRoleChange(userId: string, role: UserRole) {
    setLoading(userId)
    const result = await updateMemberRole(userId, role)
    if (result?.error) sileo.error({ title: result.error })
    else sileo.success({ title: 'Role updated' })
    setLoading(null)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          {canManage && <TableHead className="w-[60px]" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const RoleIcon = roleIcon[member.role]
          return (
            <TableRow key={member.id}>
              <TableCell className="align-middle">
                <span className="font-medium">{member.email ?? 'Unknown'}</span>
                {member.id === currentUserId && (
                  <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                )}
              </TableCell>
              <TableCell className="align-middle">
                <Badge
                  variant="outline"
                  className={`flex w-fit items-center gap-1.5 px-2 py-0.5 text-xs font-medium ${roleBadgeClass[member.role]}`}
                >
                  <RoleIcon className="h-3 w-3" />
                  {member.role}
                </Badge>
              </TableCell>
              {canManage && (
                <TableCell className="align-middle">
                  {member.id !== currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={loading === member.id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isOwner && (
                          <>
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                              Change role
                            </DropdownMenuLabel>
                            {(['admin', 'editor', 'viewer'] as UserRole[]).map(
                              (role) => {
                                const Icon = roleIcon[role]
                                return (
                                  <DropdownMenuItem
                                    key={role}
                                    onClick={() => handleRoleChange(member.id, role)}
                                    disabled={member.role === role}
                                  >
                                    <Icon className="mr-2 h-4 w-4" />
                                    Set as {role}
                                  </DropdownMenuItem>
                                )
                              }
                            )}
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleRemove(member.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
