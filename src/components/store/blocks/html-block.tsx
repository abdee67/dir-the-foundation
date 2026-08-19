import type { HtmlBlock } from '@/types/db'

/** Admin-only raw HTML escape hatch (docs/architecture.md §4) — intentionally NOT sanitized;
 * only org admins with CMS write access can author this block. */
export function HtmlBlockView({ block }: { block: HtmlBlock }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6" dangerouslySetInnerHTML={{ __html: block.raw }} />
  )
}
