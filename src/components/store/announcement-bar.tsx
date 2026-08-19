'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

function dismissKey(text: string): string {
  return `dir-announcement-dismissed:${text}`
}

/** settings.storefront.announcement text — sleek, editorial, dismissible. */
export function AnnouncementBar({ text }: { text?: string | null }) {
  const [dismissed, setDismissed] = useState(false)
  const defaultText = text || 'DIR (ድር) THE FOUNDATION'

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(dismissKey(defaultText)) === '1') setDismissed(true)
    } catch {
      // sessionStorage unavailable
    }
  }, [defaultText])

  if (dismissed) return null

  function handleDismiss() {
    setDismissed(true)
    try {
      window.sessionStorage.setItem(dismissKey(defaultText), '1')
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative flex min-h-[34px] w-full items-center justify-center bg-black px-8 py-1.5 text-center text-[11px] font-medium tracking-[0.16em] uppercase text-white">
      <span className="truncate px-2">{defaultText}</span>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={handleDismiss}
        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-none p-1 text-white/70 transition-colors hover:text-white"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
