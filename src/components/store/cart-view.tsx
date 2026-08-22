'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

import { formatMoney } from '@/lib/money'
import { CartLineItem } from './cart-line-item'
import { useCart } from './cart-context'
import { storePath } from './store-links'

export function CartView({ orgSlug }: { orgSlug: string; lang?: string }) {
  const { items, subtotal, mounted } = useCart()

  if (!mounted) {
    return <div className="h-64" aria-hidden />
  }

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center bg-neutral-100 text-neutral-400">
          <ShoppingBag className="size-6 stroke-[1.5]" />
        </div>
        <h2 className="sf-font-display text-xl font-normal uppercase text-neutral-900 sm:text-2xl">
          YOUR BAG IS EMPTY
        </h2>
        <p className="mt-2 text-xs text-neutral-500">
          You have no items in your shopping bag.
        </p>
        <Link
          href={storePath(orgSlug, '/products')}
          className="mt-8 inline-flex h-12 items-center justify-center border border-black bg-black px-8 text-xs font-semibold tracking-[0.18em] uppercase text-white transition-colors hover:bg-neutral-800"
        >
          EXPLORE THE COLLECTION
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(21rem,25rem)] lg:items-start lg:gap-x-16 xl:gap-x-24">
      <section className="min-w-0">
        <div className="flex items-end justify-between border-b border-neutral-900 pb-4">
          <h2 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-neutral-900">Selected pieces</h2>
          <p className="text-[10px] tracking-[0.14em] uppercase text-neutral-500">
            {items.length} {items.length === 1 ? 'piece' : 'pieces'}
          </p>
        </div>
        <div className="divide-y divide-neutral-200 border-b border-neutral-200">
          {items.map((item) => (
            <CartLineItem key={item.lineKey ?? `${item.productId}-${item.variantId ?? ''}`} item={item} />
          ))}
        </div>
      </section>

      <aside className="w-full lg:sticky lg:top-28">
        <div className="border border-neutral-900 bg-[#f5f4f2] p-5 sm:p-6">
          <div className="flex items-end justify-between border-b border-neutral-900 pb-5">
            <h2 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-neutral-900">Order summary</h2>
            <span className="text-[10px] tracking-[0.14em] uppercase text-neutral-500">DIR</span>
          </div>

          <div className="space-y-3 py-5 text-sm">
            <div className="flex items-center justify-between gap-4 text-neutral-600">
              <span>Bag subtotal</span>
              <span className="font-medium tabular-nums text-neutral-900">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex items-start justify-between gap-4 text-neutral-600">
              <span>Delivery</span>
              <span className="max-w-36 text-right text-xs leading-4 text-neutral-500">Calculated at checkout</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between border-t border-neutral-300 pt-5">
            <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-900">Bag total</span>
            <span className="text-2xl font-semibold tabular-nums text-neutral-900">{formatMoney(subtotal)}</span>
          </div>

          <Link
            href={storePath(orgSlug, '/checkout')}
            className="mt-7 flex h-12 w-full items-center justify-center border border-black bg-black px-4 text-[11px] font-semibold tracking-[0.18em] uppercase text-white transition-colors hover:bg-neutral-800"
          >
            Continue to checkout
          </Link>

          <p className="mt-5 border-t border-neutral-300 pt-4 text-[11px] leading-5 text-neutral-600">
            Delivery cost is calculated from your selected district at checkout. Payment instructions are shown after your order is placed.
          </p>
        </div>
      </aside>
    </div>
  )
}
