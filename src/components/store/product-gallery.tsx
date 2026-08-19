'use client'

import { useState } from 'react'

import { cn } from '@/lib/utils'

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0)
  const hasImages = images.length > 0
  const src = hasImages ? images[Math.min(active, images.length - 1)] : null

  return (
    <>
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 lg:hidden">
        {hasImages ? (
          images.map((image, index) => (
            <div key={image + index} className="aspect-[3/4] w-[88%] shrink-0 snap-start overflow-hidden bg-neutral-100 first:w-[88%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={index === 0 ? name : `${name} — image ${index + 1}`}
                className="size-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))
        ) : (
          <div className="flex aspect-[3/4] w-full items-center justify-center bg-neutral-100 text-[10px] tracking-[0.16em] uppercase text-neutral-400">
            DIR collection
          </div>
        )}
      </div>

      <div className="hidden flex-col space-y-4 lg:flex">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={name}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-[10px] tracking-[0.16em] uppercase text-neutral-400">
              DIR collection
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={image + index}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`View image ${index + 1} of ${name}`}
                aria-pressed={index === active}
                className={cn(
                  'relative aspect-[3/4] w-16 shrink-0 overflow-hidden bg-neutral-100 transition-opacity',
                  index === active ? 'ring-1 ring-black opacity-100' : 'opacity-55 hover:opacity-100',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" className="size-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
