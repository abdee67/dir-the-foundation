'use client'

import type { HeroBlock } from '@/types/db'
import { Input } from '@/components/ui/input'
import { MediaPicker } from '@/components/admin/media-picker'
import { Field } from './field'

interface HeroFormProps {
  block: HeroBlock
  onChange: (next: HeroBlock) => void
}

function HeroForm({ block, onChange }: HeroFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Heading">
        <Input value={block.heading} onChange={(e) => onChange({ ...block, heading: e.target.value })} />
      </Field>
      <Field label="Subheading">
        <Input
          value={block.subheading ?? ''}
          onChange={(e) => onChange({ ...block, subheading: e.target.value })}
        />
      </Field>
      <Field label="Image">
        <MediaPicker
          value={block.image ? { id: '', path: block.image } : null}
          onChange={(m) => onChange({ ...block, image: m?.path })}
        />
      </Field>
      <Field label="Button label">
        <Input
          value={block.ctaLabel ?? ''}
          onChange={(e) => onChange({ ...block, ctaLabel: e.target.value })}
        />
      </Field>
      <Field label="Button link">
        <Input
          value={block.ctaHref ?? ''}
          placeholder="/products"
          onChange={(e) => onChange({ ...block, ctaHref: e.target.value })}
        />
      </Field>
    </div>
  )
}

export { HeroForm }
