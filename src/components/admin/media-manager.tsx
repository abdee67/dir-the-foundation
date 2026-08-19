'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { FileIcon, Loader2, Trash2, Upload } from 'lucide-react'

import { mediaUrl } from '@/lib/media-url'
import { MAX_MEDIA_UPLOAD_BYTES, MAX_MEDIA_UPLOAD_LABEL } from '@/lib/media'
import { deleteMediaAction, listMediaAction, updateMediaAction, uploadMediaAction } from '@/lib/actions/media'
import type { Media } from '@/types/db'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/ui/empty-state'
import { CopyButton } from '@/components/ui/copy-button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

interface MediaManagerProps {
  initialItems: Media[]
}

function MediaManager({ initialItems }: MediaManagerProps) {
  const [items, setItems] = React.useState<Media[]>(initialItems)
  const [search, setSearch] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const isFirstRun = React.useRef(true)

  const refresh = React.useCallback(async (query: string) => {
    setLoading(true)
    const result = await listMediaAction(undefined, query || undefined)
    if (result.ok) setItems(result.data ?? [])
    setLoading(false)
  }, [])

  React.useEffect(() => {
    // Skip the redundant fetch on mount — initialItems already came from the server component.
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    void refresh(search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    const acceptedFiles = files.filter((file) => file.size <= MAX_MEDIA_UPLOAD_BYTES)
    const rejectedCount = files.length - acceptedFiles.length
    if (rejectedCount > 0) {
      toast.error(`${rejectedCount} file${rejectedCount === 1 ? '' : 's'} skipped: the limit is ${MAX_MEDIA_UPLOAD_LABEL} per file.`)
    }
    if (acceptedFiles.length === 0) {
      if (event.target) event.target.value = ''
      return
    }

    setUploading(true)
    let failures = 0
    // Upload sequentially: this avoids loading several large Server Action
    // bodies into memory at once while still supporting bulk selection.
    for (const file of acceptedFiles) {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadMediaAction(formData)
      if (!result.ok) failures += 1
    }
    setUploading(false)
    if (event.target) event.target.value = ''
    if (failures > 0) toast.error(`${failures} file${failures === 1 ? '' : 's'} failed to upload.`)
    else toast.success(`${acceptedFiles.length} file${acceptedFiles.length === 1 ? '' : 's'} uploaded.`)
    void refresh(search)
  }

  async function handleDelete(id: string) {
    const result = await deleteMediaAction(id)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  async function handleAltSave(id: string, alt: string) {
    const result = await updateMediaAction(id, { alt })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, alt } : item)))
    toast.success('Updated.')
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search media..." className="max-w-xs" />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleUpload}
        />
        <Button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={FileIcon}
          title="No media yet"
          description="Upload images and files to use across pages, products and listings."
          action={
            <Button type="button" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" />
              Upload files
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {items.map((item) => (
            <MediaCard key={item.id} item={item} onDelete={handleDelete} onAltSave={handleAltSave} />
          ))}
        </div>
      )}
    </div>
  )
}

interface MediaCardProps {
  item: Media
  onDelete: (id: string) => Promise<void>
  onAltSave: (id: string, alt: string) => Promise<void>
}

function MediaCard({ item, onDelete, onAltSave }: MediaCardProps) {
  const [alt, setAlt] = React.useState(item.alt ?? '')
  const isImage = item.mime?.startsWith('image/')

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex flex-col gap-1.5 border border-border bg-card p-1.5 text-left transition-colors hover:border-foreground"
        >
          <div className="flex aspect-square items-center justify-center overflow-hidden bg-muted">
            {isImage ? (
              <img src={mediaUrl(item.path)} alt={item.alt ?? ''} className="size-full object-cover" />
            ) : (
              <FileIcon className="size-6 text-muted-foreground" />
            )}
          </div>
          <div className="truncate text-xs font-medium">{item.name ?? item.path}</div>
          <div className="text-2xs text-muted-foreground">{formatSize(item.size)}</div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="flex flex-col gap-3">
          <div className="flex aspect-video items-center justify-center overflow-hidden bg-muted">
            {isImage ? (
              <img src={mediaUrl(item.path)} alt={item.alt ?? ''} className="size-full object-cover" />
            ) : (
              <FileIcon className="size-8 text-muted-foreground" />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={`alt-${item.id}`}>Alt text</Label>
            <div className="flex gap-1.5">
              <Input id={`alt-${item.id}`} value={alt} onChange={(e) => setAlt(e.target.value)} />
              <Button type="button" variant="outline" size="sm" onClick={() => onAltSave(item.id, alt)}>
                Save
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <span className="truncate">{item.path}</span>
              <CopyButton text={item.path} />
            </div>
          </div>

          <ConfirmDialog
            trigger={
              <Button type="button" variant="destructive" size="sm">
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            }
            title="Delete this media file?"
            description="This removes it from storage and can't be undone. Pages or products referencing it will show a broken image."
            confirmLabel="Delete"
            destructive
            onConfirm={() => onDelete(item.id)}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { MediaManager }
