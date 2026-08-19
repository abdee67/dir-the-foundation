'use client'

import type { ListingsGridBlock } from '@/types/db'
import { Input } from '@/components/ui/input'
import { Field } from './field'

interface ListingsGridFormProps {
  block: ListingsGridBlock
  onChange: (next: ListingsGridBlock) => void
}

function ListingsGridForm({ block, onChange }: ListingsGridFormProps) {
  return (
    <Field label="Limit" help="Number of listings to show. Leave blank to show all active listings.">
      <Input
        type="number"
        min={1}
        value={block.limit ?? ''}
        onChange={(e) => onChange({ ...block, limit: e.target.value ? Number(e.target.value) : undefined })}
      />
    </Field>
  )
}

export { ListingsGridForm }
