import Link from 'next/link'

import { mediaUrl } from '@/lib/media-url'
import type { HeroBlock } from '@/types/db'

import { resolveMenuHref } from '../store-links'
import type { BlockRenderContext } from './render-blocks'

export function HeroBlockView({ block, ctx }: { block: HeroBlock; ctx: BlockRenderContext }) {
  const hasImage = Boolean(block.image)

  return (
    <section className="relative flex min-h-[380px] w-full items-center overflow-hidden bg-muted sm:min-h-[460px]">
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl(block.image as string)} alt="" className="absolute inset-0 size-full object-cover" />
      ) : null}
      {hasImage ? <div className="absolute inset-0 bg-black/40" /> : null}
      <div className="relative mx-auto flex max-w-3xl flex-col items-start gap-4 px-6 py-16 sm:px-10">
        <h1 className={hasImage ? 'text-2xl font-semibold text-white sm:text-3xl' : 'text-2xl font-semibold text-foreground sm:text-3xl'}>
          {block.heading}
        </h1>
        {block.subheading ? (
          <p className={hasImage ? 'max-w-xl text-sm text-white/90' : 'max-w-xl text-sm text-muted-foreground'}>
            {block.subheading}
          </p>
        ) : null}
        {block.ctaLabel && block.ctaHref ? (
          <Link
            href={resolveMenuHref(ctx.org.slug, block.ctaHref)}
            className="mt-2 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {block.ctaLabel}
          </Link>
        ) : null}
      </div>
    </section>
  )
}
