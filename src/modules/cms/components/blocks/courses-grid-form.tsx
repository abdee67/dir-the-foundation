'use client'

import type { CoursesGridBlock } from '@/types/db'
import { Input } from '@/components/ui/input'
import { Field } from './field'

interface CoursesGridFormProps {
  block: CoursesGridBlock
  onChange: (next: CoursesGridBlock) => void
}

function CoursesGridForm({ block, onChange }: CoursesGridFormProps) {
  return (
    <Field label="Limit" help="Number of courses to show. Leave blank to show all active courses.">
      <Input
        type="number"
        min={1}
        value={block.limit ?? ''}
        onChange={(e) => onChange({ ...block, limit: e.target.value ? Number(e.target.value) : undefined })}
      />
    </Field>
  )
}

export { CoursesGridForm }
