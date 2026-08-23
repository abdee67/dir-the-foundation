'use client'

import { X } from 'lucide-react'

import { formatMoney } from '@/lib/money'
import type { CartItem } from './cart-context'
import { useCart } from './cart-context'
import { QtyStepper } from './qty-stepper'

export function CartLineItem({ item }: { item: CartItem; lang?: string }) {
  const { setQty, remove } = useCart()

  return (
    <div className="flex gap-4 py-5 sm:gap-5 sm:py-6">
      <div className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden bg-neutral-100 sm:w-28">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.name} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-[9px] uppercase tracking-widest text-neutral-400">
            DIR
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="line-clamp-2 text-xs font-semibold tracking-[0.08em] uppercase text-neutral-900 sm:text-sm">
              {item.name}
            </h4>
            {item.variantName && (
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-neutral-500">
                Size: {item.variantName}
              </p>
            )}
            {item.color && <p className="mt-0.5 text-[11px] uppercase tracking-wide text-neutral-500">Color: {item.color}</p>}
            {item.reveal && (
              <p className="mt-1 text-[10px] uppercase tracking-wide text-neutral-500">
                {[item.reveal.fit, item.reveal.color, item.reveal.size].filter(Boolean).join(' · ') || 'Reveal selection'}
                {item.reveal.purchaseType === 'pre_order' ? ' · Pre-order' : ''}
                {item.reveal.customizationText ? ` · ${item.reveal.customizationText}` : ''}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Remove item"
            onClick={() => remove(item.productId, item.variantId, item.lineKey)}
            className="p-1 text-neutral-400 transition-colors hover:text-black"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <QtyStepper
            size="sm"
            value={item.qty}
            onChange={(qty) => setQty(item.productId, item.variantId, qty, item.lineKey)}
          />
          <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-900">
            {formatMoney(item.unitPrice * item.qty)}
          </span>
        </div>
      </div>
    </div>
  )
}
