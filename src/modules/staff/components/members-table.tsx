'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'

import type { Role } from '@/types/db'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DataTable } from '@/components/ui/data-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { removeMemberAction, updateMemberRoleAction } from '@/modules/staff/actions'
import { ROLE_VALUES } from '@/modules/staff/schemas'

export interface StaffMemberRow {
  userId: string
  role: Role
  fullName: string | null
  phone: string | null
  createdAt: string
}

const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
  viewer: 'Viewer',
}

function initials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function shortId(id: string): string {
  return `${id.slice(0, 8)}…`
}

interface MembersTableProps {
  members: StaffMemberRow[]
  currentRole: Role
  currentUserId: string
}

function MembersTable({ members, currentRole, currentUserId }: MembersTableProps) {
  const router = useRouter()
  const [pendingId, setPendingId] = React.useState<string | null>(null)
  const ownerCount = members.filter((m) => m.role === 'owner').length
  const isOwner = currentRole === 'owner'

  async function handleRoleChange(userId: string, role: Role) {
    setPendingId(userId)
    try {
      const result = await updateMemberRoleAction({ userId, role })
      if (result.ok) {
        toast.success('Role updated')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } finally {
      setPendingId(null)
    }
  }

  async function handleRemove(userId: string) {
    const result = await removeMemberAction({ userId })
    if (result.ok) {
      toast.success('Member removed')
      router.refresh()
    } else {
      toast.error(result.error)
      throw new Error(result.error)
    }
  }

  const columns: ColumnDef<StaffMemberRow>[] = [
    {
      id: 'fullName',
      accessorFn: (row) => row.fullName ?? '',
      header: 'Member',
      cell: ({ row }) => {
        const member = row.original
        return (
          <div className="flex items-center gap-2.5">
            <Avatar className="size-7">
              <AvatarFallback>{initials(member.fullName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {member.fullName ?? 'Unnamed'}
                {member.userId === currentUserId ? (
                  <Badge variant="outline" className="text-2xs">
                    You
                  </Badge>
                ) : null}
              </span>
              <span className="text-xs text-muted-foreground">{shortId(member.userId)}</span>
            </div>
          </div>
        )
      },
    },
    {
      id: 'phone',
      accessorFn: (row) => row.phone ?? '',
      header: 'Phone',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.phone ?? '—'}</span>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const member = row.original
        const disableSelect =
          pendingId === member.userId || (member.role === 'owner' && !isOwner)

        return (
          <Select
            value={member.role}
            disabled={disableSelect}
            onValueChange={(next) => handleRoleChange(member.userId, next as Role)}
          >
            <SelectTrigger className="h-7 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_VALUES.filter((role) => role !== 'owner' || isOwner).map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const member = row.original
        const blockRemove = member.role === 'owner' && (!isOwner || ownerCount <= 1)

        return (
          <div className="flex justify-end">
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm" disabled={blockRemove}>
                  Remove
                </Button>
              }
              title={`Remove ${member.fullName ?? 'this member'}?`}
              description="They'll immediately lose access to this organization."
              confirmLabel="Remove"
              destructive
              onConfirm={() => handleRemove(member.userId)}
            />
          </div>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={members}
      searchKey="fullName"
      searchPlaceholder="Search members..."
      emptyState={<span className="text-muted-foreground">No staff members yet.</span>}
    />
  )
}

export { MembersTable, ROLE_LABELS, shortId }
