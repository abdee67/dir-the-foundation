'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronDown, History } from 'lucide-react'
import { format } from 'date-fns'

import { cn } from '@/lib/utils'
import { restoreRevisionAction } from '@/modules/cms/actions'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export interface RevisionRow {
  id: number
  created_at: string
  savedByName: string
}

interface RevisionHistoryProps {
  pageId: string
  revisions: RevisionRow[]
}

function RevisionHistory({ pageId, revisions }: RevisionHistoryProps) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  async function handleRestore(revisionId: number) {
    const result = await restoreRevisionAction({ pageId, revisionId })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Revision restored to draft.')
    router.refresh()
  }

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-[13px] font-medium">
          <History className="size-4 text-muted-foreground" />
          Revision history ({revisions.length})
        </span>
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="flex flex-col divide-y border-t">
          {revisions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No published revisions yet.</p>
          ) : (
            revisions.map((revision) => (
              <div key={revision.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                <div className="flex flex-col">
                  <span className="text-[13px]">{format(new Date(revision.created_at), 'd MMM yyyy, h:mm a')}</span>
                  <span className="text-xs text-muted-foreground">by {revision.savedByName}</span>
                </div>
                <ConfirmDialog
                  trigger={
                    <Button type="button" variant="outline" size="sm">
                      Restore
                    </Button>
                  }
                  title="Restore this revision?"
                  description="This loads the revision into your draft. It won't go live until you publish."
                  confirmLabel="Restore to draft"
                  onConfirm={() => handleRestore(revision.id)}
                />
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

export { RevisionHistory }
