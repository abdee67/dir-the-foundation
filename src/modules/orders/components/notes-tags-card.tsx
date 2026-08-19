'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateOrderNoteAction, updateOrderTagsAction } from '@/modules/orders/actions'

interface NotesTagsCardProps {
  orderId: string
  noteInternal: string | null
  noteCustomer: string | null
  tags: string[] | null
}

function NotesTagsCard({ orderId, noteInternal, noteCustomer, tags }: NotesTagsCardProps) {
  const router = useRouter()
  const [note, setNote] = React.useState(noteInternal ?? '')
  const [noteSaving, setNoteSaving] = React.useState(false)
  const [tagList, setTagList] = React.useState<string[]>(tags ?? [])
  const [tagInput, setTagInput] = React.useState('')
  const [tagsSaving, setTagsSaving] = React.useState(false)

  React.useEffect(() => {
    setNote(noteInternal ?? '')
  }, [noteInternal])

  React.useEffect(() => {
    setTagList(tags ?? [])
  }, [tags])

  async function saveNote() {
    setNoteSaving(true)
    try {
      const result = await updateOrderNoteAction({ orderId, note_internal: note })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Note saved')
      router.refresh()
    } finally {
      setNoteSaving(false)
    }
  }

  function addTag() {
    const value = tagInput.trim()
    if (!value || tagList.includes(value)) {
      setTagInput('')
      return
    }
    setTagList((prev) => [...prev, value])
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTagList((prev) => prev.filter((t) => t !== tag))
  }

  async function saveTags() {
    setTagsSaving(true)
    try {
      const result = await updateOrderTagsAction({ orderId, tags: tagList })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Tags saved')
      router.refresh()
    } finally {
      setTagsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes &amp; tags</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="note-internal">Internal note</Label>
          <Textarea
            id="note-internal"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Staff-only note…"
          />
          <div>
            <Button size="sm" onClick={saveNote} disabled={noteSaving || note === (noteInternal ?? '')}>
              {noteSaving ? 'Saving…' : 'Save note'}
            </Button>
          </div>
        </div>

        {noteCustomer ? (
          <div className="flex flex-col gap-1">
            <Label>Customer note</Label>
            <p className="text-muted-foreground text-[13px] italic">{noteCustomer}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tag-input">Tags</Label>
          <div className="flex flex-wrap gap-1.5">
            {tagList.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              id="tag-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
              placeholder="Add a tag, press Enter"
              className="h-8"
            />
            <Button type="button" variant="outline" size="sm" onClick={addTag}>
              Add
            </Button>
          </div>
          <div>
            <Button size="sm" onClick={saveTags} disabled={tagsSaving}>
              {tagsSaving ? 'Saving…' : 'Save tags'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { NotesTagsCard }
