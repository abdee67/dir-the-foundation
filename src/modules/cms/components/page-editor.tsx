'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, ExternalLink } from 'lucide-react'

import type { CmsBlock, CmsPage } from '@/types/db'
import { discardDraftAction, publishAction, saveDraftAction, updatePageTitleAction } from '@/modules/cms/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { BlockEditor } from './block-editor'
import { RevisionHistory, type RevisionRow } from './revision-history'
import type { CategoryOption } from './block-meta'

interface PageEditorProps {
  page: CmsPage
  orgSlug: string
  categories: CategoryOption[]
  revisions: RevisionRow[]
}

function PageEditor({ page, orgSlug, categories, revisions }: PageEditorProps) {
  const router = useRouter()
  const [title, setTitle] = React.useState(page.title)
  const [blocks, setBlocks] = React.useState<CmsBlock[]>(page.draft_blocks ?? page.blocks)
  const [dirty, setDirty] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const hasDraft = page.draft_blocks !== null || dirty
  // Best-effort storefront URL — this slice doesn't own the (store) route implementation, so the
  // Exact public paths are determined by the flat storefront routing.
  const viewHref = page.type === 'home' ? `/s/${orgSlug}` : `/s/${orgSlug}/${page.slug}`

  function handleBlocksChange(next: CmsBlock[]) {
    setBlocks(next)
    setDirty(true)
  }

  async function handleTitleBlur() {
    if (title.trim() === page.title || !title.trim()) {
      setTitle(page.title)
      return
    }
    const result = await updatePageTitleAction({ pageId: page.id, title: title.trim() })
    if (!result.ok) {
      toast.error(result.error)
      setTitle(page.title)
      return
    }
    router.refresh()
  }

  async function handleSaveDraft() {
    setSaving(true)
    const result = await saveDraftAction({ pageId: page.id, blocks })
    setSaving(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setDirty(false)
    toast.success('Draft saved.')
    router.refresh()
  }

  async function handlePublish() {
    const result = await publishAction({ pageId: page.id })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Page published.')
    router.refresh()
  }

  async function handleDiscard() {
    const result = await discardDraftAction({ pageId: page.id })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setBlocks(page.blocks)
    setDirty(false)
    toast.success('Draft discarded.')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/cms/pages"
              className="-ml-1 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">Back</span>
            </Link>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="h-8 max-w-md border-transparent bg-transparent px-1.5 text-xl font-semibold shadow-none hover:border-input focus-visible:border-ring"
            />
            <Badge variant={page.status === 'published' ? 'success' : 'secondary'}>
              {page.status === 'published' ? 'Published' : 'Draft'}
            </Badge>
            {hasDraft && page.status === 'published' ? <Badge variant="warning">Unpublished changes</Badge> : null}
          </div>
          <p className="pl-8 text-sm text-muted-foreground">/{page.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          {page.status === 'published' ? (
            <Button variant="outline" asChild>
              <Link href={viewHref} target="_blank">
                <ExternalLink className="size-4" />
                View
              </Link>
            </Button>
          ) : null}
          {hasDraft ? (
            <ConfirmDialog
              trigger={
                <Button type="button" variant="outline">
                  Discard draft
                </Button>
              }
              title="Discard this draft?"
              description="Reverts to the last published version. This can't be undone."
              confirmLabel="Discard"
              destructive
              onConfirm={handleDiscard}
            />
          ) : null}
          <Button type="button" variant="secondary" disabled={saving} onClick={handleSaveDraft}>
            {saving ? 'Saving...' : 'Save draft'}
          </Button>
          <ConfirmDialog
            trigger={<Button type="button">Publish</Button>}
            title="Publish this page?"
            description="Your draft becomes the live version customers see."
            confirmLabel="Publish"
            onConfirm={handlePublish}
          />
        </div>
      </div>

      <BlockEditor blocks={blocks} onChange={handleBlocksChange} categories={categories} />

      <RevisionHistory pageId={page.id} revisions={revisions} />
    </div>
  )
}

export { PageEditor }
