'use client'

import { useEffect, useState } from 'react'

type CountdownVariant = 'full' | 'compact' | 'card'

function remaining(targetDate: string) {
  const seconds = Math.max(0, Math.floor((new Date(targetDate).getTime() - Date.now()) / 1000))
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    expired: seconds <= 0,
  }
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function CountdownTimer({
  targetDate,
  label,
  variant = 'full',
}: {
  targetDate: string
  label: string
  variant?: CountdownVariant
}) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const update = () => setTime(remaining(targetDate))
    update()
    setHydrated(true)
    const id = window.setInterval(update, 1000)
    return () => window.clearInterval(id)
  }, [targetDate])

  if (!hydrated) return null
  if (time.expired) return null
  if (variant === 'compact') {
    return <span className="text-[10px] font-semibold tracking-[0.08em] tabular-nums text-amber-800">{label} {time.days}d {pad(time.hours)}h {pad(time.minutes)}m</span>
  }
  if (variant === 'card') {
    return (
      <span className="inline-flex items-center gap-1 border border-black/20 bg-black/88 px-2 py-1 text-[9px] font-semibold tracking-[0.12em] uppercase text-white shadow-sm backdrop-blur-sm tabular-nums">
        <span>Restock</span>
        <span className="text-white/75">{time.days > 0 ? `${time.days}d ` : ''}{pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}</span>
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-amber-700">{label}</p>
      <div className="flex flex-wrap items-center gap-2 text-amber-800">
        <TimeBlock value={time.days} label="Days" />
        <TimeBlock value={time.hours} label="Hours" />
        <TimeBlock value={time.minutes} label="Mins" />
        <TimeBlock value={time.seconds} label="Secs" />
      </div>
    </div>
  )
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[44px] flex-col items-center border border-amber-100 bg-amber-50 px-2 py-1.5">
      <span className="text-lg font-bold leading-none tabular-nums">{pad(value)}</span>
      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide">{label}</span>
    </div>
  )
}
