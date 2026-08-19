'use client'

import * as React from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const NAVIGATION_TIMEOUT_MS = 10_000

/** Shows immediate feedback for internal links while App Router fetches a page. */
export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = React.useState(false)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const finish = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    setIsNavigating(false)
  }, [])

  React.useEffect(() => { finish() }, [finish, pathname, searchParams])

  React.useEffect(() => {
    function beginForInternalLink(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target
      if (!(target instanceof Element)) return
      const link = target.closest('a[href]') as HTMLAnchorElement | null
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return

      const href = link.getAttribute('href')
      if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(href)) return

      const nextUrl = new URL(link.href, window.location.href)
      const currentUrl = new URL(window.location.href)
      const isSameUrl = nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search
      if (nextUrl.origin !== currentUrl.origin || isSameUrl) return

      setIsNavigating(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(finish, NAVIGATION_TIMEOUT_MS)
    }

    document.addEventListener('click', beginForInternalLink, true)
    window.addEventListener('popstate', finish)
    return () => {
      document.removeEventListener('click', beginForInternalLink, true)
      window.removeEventListener('popstate', finish)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [finish])

  return (
    <div aria-hidden="true" className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 transition-opacity duration-200 ${isNavigating ? 'opacity-100' : 'opacity-0'}`}>
      <div className="h-full w-2/5 bg-black shadow-[0_0_12px_rgba(0,0,0,0.35)] motion-safe:animate-[navigation-progress_1.1s_ease-in-out_infinite] dark:bg-white" />
    </div>
  )
}
