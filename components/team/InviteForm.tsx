'use client'

import { useState } from 'react'
import { inviteMember } from '@/lib/actions/team'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CopyButton } from '@/components/shared/CopyButton'
import { AlertCircle, Eye, Info, Loader2, Pencil, Shield, UserPlus } from 'lucide-react'
import { sileo } from 'sileo'

const ROLE_INFO = [
  {
    role: 'admin',
    icon: Shield,
    iconClass: 'text-blue-500',
    label: 'Admin',
    description:
      'Can create, edit and publish scripts and experiments, invite or remove members, and archive resources. Cannot change member roles.',
  },
  {
    role: 'editor',
    icon: Pencil,
    iconClass: 'text-emerald-500',
    label: 'Editor',
    description:
      'Can create, edit and publish scripts, and create, start or pause experiments. Cannot invite members or archive resources.',
  },
  {
    role: 'viewer',
    icon: Eye,
    iconClass: 'text-slate-500',
    label: 'Viewer',
    description: 'Read-only access to scripts and experiments. Cannot make any changes.',
  },
]

export function InviteForm() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [role, setRole] = useState('editor')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setInviteUrl(null)
    setPending(true)

    const formData = new FormData(e.currentTarget)
    const result = await inviteMember(formData)

    if (result?.error) {
      setError(result.error)
    } else if (result?.inviteUrl) {
      setInviteUrl(result.inviteUrl)
      sileo.success({ title: 'Invite sent' })
      ;(e.target as HTMLFormElement).reset()
    }

    setPending(false)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:items-end">

        {/* ── Email ── */}
        <div className="flex-1 space-y-1.5">
          {/* h-5 fixes the label row to a known height so both columns are identical */}
          <div className="h-5 flex items-center">
            <Label htmlFor="invite-email">Email address</Label>
          </div>
          <Input
            id="invite-email"
            name="email"
            type="email"
            placeholder="colleague@example.com"
            required
          />
        </div>

        {/* ── Role ── */}
        <div className="w-full sm:w-36 space-y-1.5">
          <div className="h-5 flex items-center gap-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Role descriptions"
                  className="h-3.5 w-3.5 p-0 inline-flex items-center bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Role permissions
                </p>
                <ul className="space-y-3">
                  {ROLE_INFO.map(({ role: r, icon: Icon, iconClass, label, description }) => (
                    <li key={r} className="flex gap-2.5">
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${iconClass}`} />
                      <div>
                        <p className="text-sm font-medium leading-none mb-1">{label}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          </div>
          <Select name="role" value={role} onValueChange={setRole} required>
            <SelectTrigger id="invite-role" className="w-full translate-y-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4}>
              <SelectItem value="admin">
                <span className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-blue-500" />
                  Admin
                </span>
              </SelectItem>
              <SelectItem value="editor">
                <span className="flex items-center gap-2">
                  <Pencil className="h-3.5 w-3.5 text-emerald-500" />
                  Editor
                </span>
              </SelectItem>
              <SelectItem value="viewer">
                <span className="flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-slate-500" />
                  Viewer
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Submit ── */}
        <Button type="submit" disabled={pending} className="sm:self-end">
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="mr-2 h-4 w-4" />
          )}
          Invite
        </Button>
      </form>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {inviteUrl && (
        <div className="rounded-md border bg-muted/50 p-3 space-y-2">
          <p className="text-sm font-medium">Invite link created</p>
          <p className="text-xs text-muted-foreground">
            Share this link with the invitee. It expires in 7 days.
          </p>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono bg-background px-2 py-1 rounded border flex-1 truncate">
              {inviteUrl}
            </code>
            <CopyButton text={inviteUrl} />
          </div>
        </div>
      )}
    </div>
  )
}
