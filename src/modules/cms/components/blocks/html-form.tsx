'use client'

import { AlertTriangle } from 'lucide-react'

import type { HtmlBlock } from '@/types/db'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Field } from './field'

interface HtmlFormProps {
  block: HtmlBlock
  onChange: (next: HtmlBlock) => void
}

function HtmlForm({ block, onChange }: HtmlFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <Alert variant="warning">
        <AlertTriangle />
        <AlertTitle>Admin-only escape hatch</AlertTitle>
        <AlertDescription>
          Raw HTML renders unescaped on the storefront. Only paste HTML you trust — this bypasses the
          sanitization the other blocks get.
        </AlertDescription>
      </Alert>
      <Field label="Raw HTML">
        <Textarea
          rows={12}
          value={block.raw}
          onChange={(e) => onChange({ ...block, raw: e.target.value })}
          className="min-h-48 font-mono text-xs"
        />
      </Field>
    </div>
  )
}

export { HtmlForm }
