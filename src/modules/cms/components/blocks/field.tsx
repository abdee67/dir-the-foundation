import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'

interface FieldProps {
  label: string
  htmlFor?: string
  help?: string
  children: ReactNode
}

/** Label-above-control wrapper shared by every block form (docs/design-system.md §c — Inputs). */
function Field({ label, htmlFor, help, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
  )
}

export { Field }
