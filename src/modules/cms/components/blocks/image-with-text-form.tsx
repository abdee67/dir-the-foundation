'use client'

import type { ImageWithTextBlock } from '@/types/db'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MediaPicker } from '@/components/admin/media-picker'
import { Field } from './field'

interface ImageWithTextFormProps {
  block: ImageWithTextBlock
  onChange: (next: ImageWithTextBlock) => void
}

function ImageWithTextForm({ block, onChange }: ImageWithTextFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Image">
        <MediaPicker
          value={block.image ? { id: '', path: block.image } : null}
          onChange={(m) => onChange({ ...block, image: m?.path ?? '' })}
        />
      </Field>
      <Field label="Heading">
        <Input value={block.heading} onChange={(e) => onChange({ ...block, heading: e.target.value })} />
      </Field>
      <Field label="Body">
        <Textarea rows={5} value={block.body} onChange={(e) => onChange({ ...block, body: e.target.value })} />
      </Field>
      <Field label="Image position">
        <Select
          value={block.imageSide}
          onValueChange={(value) => onChange({ ...block, imageSide: value as ImageWithTextBlock['imageSide'] })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}

export { ImageWithTextForm }
