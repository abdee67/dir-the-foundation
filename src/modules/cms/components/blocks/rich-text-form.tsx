'use client'

import type { RichTextBlock } from '@/types/db'
import { Textarea } from '@/components/ui/textarea'
import { Field } from './field'

interface RichTextFormProps {
  block: RichTextBlock
  onChange: (next: RichTextBlock) => void
}

function RichTextForm({ block, onChange }: RichTextFormProps) {
  return (
    <Field
      label="Content"
      help="Basic HTML is allowed (p, strong, em, a, ul/ol/li, h2/h3, br). It renders as-is on the storefront."
    >
      <Textarea
        rows={12}
        value={block.html}
        onChange={(e) => onChange({ ...block, html: e.target.value })}
        className="min-h-48 font-mono text-xs"
      />
    </Field>
  )
}

export { RichTextForm }
