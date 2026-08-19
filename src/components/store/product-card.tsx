import Link from 'next/link'

import { t, type Lang } from '@/lib/i18n'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/db'

import { SaleCountdown } from './sale-countdown'
import { RestockCountdown } from './restock-countdown'
import { storePath } from './store-links'

export interface ProductCardData
  extends Pick<
    Product,
    'id' | 'slug' | 'name' | 'price' | 'compare_at_price' | 'track_stock' | 'stock_qty' | 'low_stock_threshold' | 'allow_backorder'
  > {
  image: string | null
  secondaryImage?: string | null
  tags?: string[] | null
  sale_ends_at?: string | null
  restock_at?: string | null
}

export function ProductCard({
  orgSlug,
  product,
  lang = 'en',
}: {
  orgSlug: string
  product: ProductCardData
  lang?: Lang
}) {
  const outOfStock = product.track_stock && product.stock_qty <= 0 && !product.allow_backorder
  const hasDiscount = product.compare_at_price != null && product.compare_at_price > product.price
  const tag = product.tags?.[0] ?? null
  const isSale = tag === 'SALE'
  const hasSaleCountdown = isSale && Boolean(product.sale_ends_at)
  const hasRestockCountdown = outOfStock && Boolean(product.restock_at) && new Date(product.restock_at as string).getTime() > Date.now()

  const primarySrc = product.image
  const secondarySrc = product.secondaryImage || product.image

  return (
    <div className="group relative flex flex-col">
      {/* Product Media Container (3:4 ratio, borderless, hover crossfade) */}
      <Link
        href={storePath(orgSlug, `/products/${product.slug}`)}
        className="relative block aspect-[3/4] w-full overflow-hidden bg-neutral-100"
      >
        {primarySrc ? (
          <div className="relative size-full">
            {/* Primary Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={primarySrc}
              alt={product.name}
              className={cn(
                'size-full object-cover transition-opacity duration-300 ease-out',
                secondarySrc && secondarySrc !== primarySrc
                  ? 'group-hover:opacity-0'
                  : 'transition-transform duration-500 group-hover:scale-[1.025]',
              )}
            />

            {/* Secondary Image (Crossfade on hover if available) */}
            {secondarySrc && secondarySrc !== primarySrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={secondarySrc}
                alt={`${product.name} - Alternate view`}
                className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
              />
            )}
          </div>
        ) : (
          <div className="flex size-full items-center justify-center text-[11px] uppercase tracking-widest text-neutral-400">
            DIR Collection
          </div>
        )}

        {tag && !hasSaleCountdown && (
          <div className="absolute top-2.5 left-2.5 z-30">
            <span
              className={cn(
                'inline-block px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]',
                tag === 'SALE'
                  ? 'bg-[#c0392b] text-white'
                  : tag === 'NEW'
                  ? 'bg-black text-white'
                  : 'bg-neutral-800 text-white',
              )}
            >
              {tag}
            </span>
          </div>
        )}

        {hasSaleCountdown && product.sale_ends_at && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <SaleCountdown saleEndsAt={product.sale_ends_at} variant="card" />
          </div>
        )}

        {hasRestockCountdown && product.restock_at && (
          <div className="absolute top-2.5 right-2.5 z-30">
            <RestockCountdown restockAt={product.restock_at} variant="card" />
          </div>
        )}

        {/* Out of stock subtle overlay */}
        {outOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <span className="border border-white/80 bg-black/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
              {t('out_of_stock', lang)}
            </span>
          </div>
        )}

        {/* Desktop hover quick view / shop bar */}
        <div className="absolute right-0 bottom-0 left-0 z-10 translate-y-full bg-white/95 py-2.5 text-center backdrop-blur-sm transition-transform duration-200 ease-out group-hover:translate-y-0 hidden md:block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
            VIEW PIECE
          </span>
        </div>
      </Link>

      {/* Product Info Block */}
      <div className="flex flex-col pt-3 pb-1">
        {/* Title */}
        <Link
          href={storePath(orgSlug, `/products/${product.slug}`)}
          className="line-clamp-1 text-[13px] font-medium tracking-[0.02em] text-neutral-900 transition-colors hover:text-black"
        >
          {product.name}
        </Link>

        {/* Price & Discounts */}
        <div className="mt-1 flex items-baseline gap-2">
          <span
            className={cn(
              'text-[13px] font-semibold tabular-nums',
              hasDiscount ? 'text-[#c0392b]' : 'text-neutral-900',
            )}
          >
            {formatMoney(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-neutral-400 line-through tabular-nums">
              {formatMoney(product.compare_at_price as number)}
            </span>
          )}
        </div>

        {/* Stock */}
        {product.track_stock && product.stock_qty > 0 && product.stock_qty <= product.low_stock_threshold && (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-amber-800">
            Low Stock: Only {product.stock_qty} Available
          </span>
        )}
      </div>
    </div>
  )
}
