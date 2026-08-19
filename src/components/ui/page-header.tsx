import * as React from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  actions?: React.ReactNode
  backHref?: string
  className?: string
}

function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  backHref,
  className,
}: PageHeaderProps) {
  return (
    <div
      data-slot="page-header"
      className={cn(
        "flex flex-wrap items-start justify-between gap-4 pb-6",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        {eyebrow ? (
          <p className="text-2xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">{eyebrow}</p>
        ) : null}
        <div className="flex items-center gap-2">
          {backHref ? (
            <Link
              href={backHref}
              className="text-muted-foreground hover:text-foreground -ml-1 inline-flex size-6 items-center justify-center rounded-md transition-colors"
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">Back</span>
            </Link>
          ) : null}
          <h1 className="text-[20px] font-semibold tracking-tight text-foreground">
            {title}
          </h1>
        </div>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}

export { PageHeader }
