import * as React from "react"

import { getStatusMeta } from "@/lib/status"
import { Badge } from "@/components/ui/badge"

type StatusKind =
  | "order"
  | "payment"
  | "delivery"
  | "product"
  | "return"
  | "job"
  | "listing"
  | "review"
  | "enrollment"

interface StatusBadgeProps {
  kind: StatusKind
  value: string
  className?: string
}

function StatusBadge({ kind, value, className }: StatusBadgeProps) {
  const meta = getStatusMeta(kind, value)

  return (
    <Badge
      data-slot="status-badge"
      variant={meta.variant}
      className={className}
    >
      {meta.label}
    </Badge>
  )
}

export { StatusBadge }
