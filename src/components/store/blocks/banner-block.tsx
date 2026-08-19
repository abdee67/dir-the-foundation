import Link from 'next/link'

import { mediaUrl } from '@/lib/media-url'
import type { BannerBlock } from '@/types/db'

import { resolveMenuHref } from '../store-links'
import type { BlockRenderContext } from './render-blocks'

export function BannerBlockView({ block, ctx }: { block: BannerBlock; ctx: BlockRenderContext }) {
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={mediaUrl(block.image)} alt="" className="w-full rounded-lg object-cover" />
  )

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {block.href ? <Link href={resolveMenuHref(ctx.org.slug, block.href)}>{image}</Link> : image}
    </section>
  )
}
