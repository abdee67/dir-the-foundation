import { mediaUrl } from '@/lib/media-url'
import { cn } from '@/lib/utils'
import type { ImageWithTextBlock } from '@/types/db'

export function ImageWithTextBlockView({ block }: { block: ImageWithTextBlock }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div
        className={cn(
          'grid items-center gap-8 md:grid-cols-2',
          block.imageSide === 'right' && 'md:[&>*:first-child]:order-2',
        )}
      >
        <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl(block.image)} alt="" className="size-full object-cover" />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">{block.heading}</h2>
          <p className="text-sm whitespace-pre-line text-muted-foreground">{block.body}</p>
        </div>
      </div>
    </section>
  )
}
