import type { RichTextBlock } from '@/types/db'

import { sanitizeRichText } from '../sanitize-html'

// No @tailwindcss/typography plugin in this project (conventions.md: no new npm dependencies) —
// child-element arbitrary variants give admin-authored HTML reasonable default spacing instead.
const RICH_TEXT_CLASSES =
  'flex flex-col gap-4 text-sm leading-relaxed text-foreground ' +
  '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 ' +
  '[&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold ' +
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold ' +
  '[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground'

export function RichTextBlockView({ block }: { block: RichTextBlock }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className={RICH_TEXT_CLASSES} dangerouslySetInnerHTML={{ __html: sanitizeRichText(block.html) }} />
    </section>
  )
}
