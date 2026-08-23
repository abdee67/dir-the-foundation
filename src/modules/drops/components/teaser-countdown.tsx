'use client'

import * as React from 'react'

function timeRemaining(endsAt: string) {
  const remaining = Math.max(0, new Date(endsAt).getTime() - Date.now())
  const totalSeconds = Math.floor(remaining / 1000)
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds }
}

function padded(value: number) {
  return String(value).padStart(2, '0')
}

export function TeaserCountdown({ endsAt, onComplete }: { endsAt: string; onComplete?: () => void }) {
  // Start with a stable server/client render; update immediately after hydration.
  const [remaining, setRemaining] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const expiredRef = React.useRef(false)
  const retryTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    expiredRef.current = false
    if (retryTimerRef.current) clearInterval(retryTimerRef.current)

    const update = () => {
      const next = timeRemaining(endsAt)
      setRemaining(next)

      if (!expiredRef.current && new Date(endsAt).getTime() <= Date.now()) {
        expiredRef.current = true
        // Fire immediately, then retry every 3 s until the server transitions
        // the phase (which unmounts this component with new content).
        onComplete?.()
        retryTimerRef.current = setInterval(() => {
          onComplete?.()
        }, 3_000)
      }
    }
    update()
    const tick = window.setInterval(update, 1_000)

    return () => {
      window.clearInterval(tick)
      if (retryTimerRef.current) clearInterval(retryTimerRef.current)
    }
  }, [endsAt, onComplete])

  const items = [
    ['Days', remaining.days],
    ['Hours', remaining.hours],
    ['Minutes', remaining.minutes],
    ['Seconds', remaining.seconds],
  ] as const

  return (
    <div role="timer" aria-label={`${remaining.days} days, ${remaining.hours} hours, ${remaining.minutes} minutes, and ${remaining.seconds} seconds remaining`} className="flex items-start justify-center gap-2 text-white sm:gap-4">
      {items.map(([label, value], index) => (
        <React.Fragment key={label}>
          {index > 0 && <span aria-hidden="true" className="pt-1.5 text-base font-light text-white/55 sm:pt-2 sm:text-xl">:</span>}
          <div className="min-w-[2.6rem] text-center sm:min-w-[3.75rem]">
            <span className="block font-mono text-[clamp(1.55rem,5.5vw,3.25rem)] font-light leading-none tracking-[-0.07em] tabular-nums">{padded(value)}</span>
            <span className="mt-2 block text-[8px] font-medium tracking-[0.2em] uppercase text-white/65 sm:text-[9px]">{label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}
