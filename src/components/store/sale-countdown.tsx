'use client'

import { useEffect, useRef, useState } from 'react'

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

function calcRemaining(saleEndsAt: string): TimeRemaining {
  // Both sides are epoch-ms — timezone-safe regardless of the customer's
  // local clock offset, because Date.parse always returns UTC epoch time.
  const diffMs = new Date(saleEndsAt).getTime() - Date.now()

  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }

  const totalSec = Math.floor(diffMs / 1000)
  const days    = Math.floor(totalSec / 86400)
  const hours   = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  return { days, hours, minutes, seconds, expired: false }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

interface SaleCountdownProps {
  saleEndsAt: string
  /** 'full' shows Days/Hours/Mins/Secs blocks. 'compact' is inline. 'card' is an image-corner label. */
  variant?: 'full' | 'compact' | 'card'
}

export function SaleCountdown({ saleEndsAt, variant = 'full' }: SaleCountdownProps) {
  const [time, setTime] = useState<TimeRemaining>(() => calcRemaining(saleEndsAt))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Recalculate immediately in case of server/client hydration delta
    setTime(calcRemaining(saleEndsAt))

    if (calcRemaining(saleEndsAt).expired) return

    intervalRef.current = setInterval(() => {
      const next = calcRemaining(saleEndsAt)
      setTime(next)
      if (next.expired && intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [saleEndsAt])

  if (time.expired) {
    return (
      <div className="inline-flex items-center border border-neutral-200 bg-white px-2 py-1 text-[10px] font-medium tracking-[0.12em] uppercase text-neutral-500">
        Sale Ended
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.08em] text-[#a83228] tabular-nums">
        SALE ·
        {time.days > 0 && `${time.days}d `}
        {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
      </span>
    )
  }

  if (variant === 'card') {
    return (
      <span className="inline-flex items-center gap-1 border border-[#c0392b]/30 bg-white/95 px-2 py-1 text-[9px] font-semibold tracking-[0.12em] uppercase text-[#a83228] shadow-sm backdrop-blur-sm tabular-nums">
        <span>Sale</span>
        <span className="text-[#c0392b]">{time.days > 0 ? `${time.days}d ` : ''}{pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}</span>
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-rose-600">
        Sale ends in
      </p>
      <div className="flex items-center gap-2">
        {time.days > 0 && (
          <>
            <TimeBlock value={time.days} label="Days" />
            <Colon />
          </>
        )}
        <TimeBlock value={time.hours}   label="Hours"   />
        <Colon />
        <TimeBlock value={time.minutes} label="Mins"    />
        <Colon />
        <TimeBlock value={time.seconds} label="Secs"    />
      </div>
    </div>
  )
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
      <div className="flex min-w-[44px] flex-col items-center border border-rose-100 bg-rose-50 px-2 py-1.5">
      <span className="text-lg font-bold tabular-nums leading-none text-rose-700">
        {pad(value)}
      </span>
      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-rose-500">
        {label}
      </span>
    </div>
  )
}

function Colon() {
  return (
    <span className="mb-3 text-lg font-bold text-rose-400">:</span>
  )
}
