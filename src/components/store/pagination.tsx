import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

import { storePath } from './store-links'

export function Pagination({
  orgSlug,
  page,
  totalPages,
  query,
  category,
  size,
  sort,
  tags,
}: {
  orgSlug: string
  page: number
  totalPages: number
  query?: string
  category?: string
  size?: string
  sort?: string
  tags?: string
}) {
  if (totalPages <= 1) return null

  function href(p: number): string {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (query) params.set('q', query)
    if (size) params.set('size', size)
    if (sort) params.set('sort', sort)
    if (tags) params.set('tags', tags)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return storePath(orgSlug, `/products${qs ? `?${qs}` : ''}`)
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  )

  return (
    <nav className="flex items-center justify-center gap-1 pt-4" aria-label="Pagination">
      <Link
        href={href(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={cn(
          'inline-flex size-8 items-center justify-center border border-neutral-200 transition-colors hover:border-black',
          page <= 1 && 'pointer-events-none opacity-40',
        )}
      >
        <ChevronLeft className="size-4" />
      </Link>

      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1">
          {i > 0 && pages[i - 1] !== p - 1 ? <span className="px-1 text-xs text-muted-foreground">…</span> : null}
          <Link
            href={href(p)}
            className={cn(
              'inline-flex size-8 items-center justify-center border text-xs font-medium transition-colors',
              p === page ? 'border-black bg-black text-white' : 'border-neutral-200 hover:border-black',
            )}
          >
            {p}
          </Link>
        </span>
      ))}

      <Link
        href={href(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={cn(
          'inline-flex size-8 items-center justify-center border border-neutral-200 transition-colors hover:border-black',
          page >= totalPages && 'pointer-events-none opacity-40',
        )}
      >
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  )
}
