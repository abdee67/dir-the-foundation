import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { TrendingDown, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  trend?: number
  className?: string
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  const isPositive = typeof trend === "number" && trend > 0
  const isNegative = typeof trend === "number" && trend < 0

  return (
    <Card data-slot="stat-card" className={cn("gap-2 p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-[12px] font-medium">
          {label}
        </span>
        {Icon ? <Icon className="text-muted-foreground size-4" /> : null}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-foreground text-[24px] font-semibold tabular-nums">
          {value}
        </span>
        {typeof trend === "number" ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[13px] font-medium tabular-nums",
              isPositive && "text-emerald-600 dark:text-emerald-400",
              isNegative && "text-red-600 dark:text-red-500",
              !isPositive && !isNegative && "text-muted-foreground"
            )}
          >
            {isPositive ? (
              <TrendingUp className="size-3.5" />
            ) : isNegative ? (
              <TrendingDown className="size-3.5" />
            ) : null}
            {Math.abs(trend)}%
          </span>
        ) : null}
      </div>
      {hint ? (
        <p className="text-muted-foreground text-[12px]">{hint}</p>
      ) : null}
    </Card>
  )
}

export { StatCard }
