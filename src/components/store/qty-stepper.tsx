'use client'

import { Minus, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'

export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 999,
  size = 'default',
  className,
}: {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  size?: 'default' | 'sm'
  className?: string
}) {
  const height = size === 'sm' ? 'h-7' : 'h-8'

  function clamp(n: number): number {
    return Math.min(max, Math.max(min, n))
  }

  return (
    <div className={cn('inline-flex items-center border border-neutral-300 bg-white', height, className)}>
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className="inline-flex h-full w-7 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black disabled:pointer-events-none disabled:opacity-40"
      >
        <Minus className="size-3.5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label="Quantity"
        value={value}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, '')
          if (digits === '') return
          onChange(clamp(Number(digits)))
        }}
        className="h-full w-9 border-x border-neutral-300 bg-transparent text-center text-[13px] tabular-nums outline-none"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className="inline-flex h-full w-7 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black disabled:pointer-events-none disabled:opacity-40"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}
