'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { MailPlus } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'

import type { Role } from '@/types/db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CopyButton } from '@/components/ui/copy-button'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { revokeInviteAction } from '@/modules/staff/actions'
import { ROLE_LABELS } from './members-table'

export interface InviteRow {
  id: string
  email: string
  role: Role
  expiresAt: string
  link: string
}

function InvitesSection({ invites }: { invites: InviteRow[] }) {
  const router = useRouter()

  async function handleRevoke(id: string) {
    const result = await revokeInviteAction({ inviteId: id })
    if (result.ok) {
      toast.success('Invite revoked')
      router.refresh()
    } else {
      toast.error(result.error)
      throw new Error(result.error)
    }
  }

  const columns: ColumnDef<InviteRow>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="font-medium">{row.original.email}</span>,
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <Badge variant="secondary">{ROLE_LABELS[row.original.role]}</Badge>,
    },
    {
      id: 'expiresAt',
      header: 'Expires',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {format(new Date(row.original.expiresAt), 'd MMM yyyy')}
        </span>
      ),
    },
    {
      id: 'link',
      header: 'Invite link',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="max-w-56 truncate text-xs text-muted-foreground">
            {row.original.link}
          </span>
          <CopyButton text={row.original.link} />
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="sm">
                Revoke
              </Button>
            }
            title="Revoke this invite?"
            description={`${row.original.email} will no longer be able to accept it.`}
            confirmLabel="Revoke"
            destructive
            onConfirm={() => handleRevoke(row.original.id)}
          />
        </div>
      ),
    },
  ]

  if (invites.length === 0) {
    return (
      <EmptyState
        icon={MailPlus}
        title="No pending invitations"
        description="Invited members appear here until they accept or the invite expires."
      />
    )
  }

  return <DataTable columns={columns} data={invites} />
}

export { InvitesSection }
