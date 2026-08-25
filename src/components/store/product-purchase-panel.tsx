'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { t, type Lang } from '@/lib/i18n'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { ProductVariant } from '@/types/db'

import { useCart } from './cart-context'
import { ProductColorSizeSelector } from './product-color-size-selector'
import { QtyStepper } from './qty-stepper'
import { RestockCountdown } from './restock-countdown'

export interface PurchaseProduct {
  id: string
  name: string
  price: number
  compare_at_price: number | null
  track_stock: boolean
  stock_qty: number
  low_stock_threshold: number
  allow_backorder: boolean
  color?: string | null
  restock_at?: string | null
}

export function ProductPurchasePanel({
  product,
  variants,
  image,
  lang = 'en',
}: {
  product: PurchaseProduct
  variants: ProductVariant[]
  image: string | null
  lang?: Lang
}) {
  const { add } = useCart()
  const defaultVariant = useMemo(() => variants.find((v) => v.is_default) ?? variants[0] ?? null, [variants])
  const [variantId, setVariantId] = useState<string | null>(defaultVariant?.id ?? null)
  const [qty, setQty] = useState(1)

  const selected = variants.find((v) => v.id === variantId) ?? null
  const price = selected ? selected.price : product.price
  const compareAt = selected ? selected.compare_at_price : product.compare_at_price
  const stock = selected ? selected.stock_qty : product.stock_qty
  const outOfStock = product.track_stock && stock <= 0 && !product.allow_backorder
  const productOutOfStock = product.track_stock && (variants.length > 0 ? variants.every((v) => v.stock_qty <= 0) : stock <= 0) && !product.allow_backorder
  const hasRestockCountdown = productOutOfStock && Boolean(product.restock_at) && new Date(product.restock_at as string).getTime() > Date.now()
  const maxQty = product.track_stock && !product.allow_backorder ? Math.max(stock, 1) : 999
  const hasDiscount = compareAt != null && compareAt > price

  // Extract color and size from selected variant for cart
  const selectedColor = useMemo(() => {
    if (!selected) return product.color ?? null
    const opts = selected.options as Record<string, string> | null
    return opts?.color ?? product.color ?? null
  }, [selected, product.color])

  const selectedSize = useMemo(() => {
    if (!selected) return null
    const opts = selected.options as Record<string, string> | null
    return opts?.size ?? selected.name ?? null
  }, [selected])

  function handleAdd() {
    if (variants.length > 0 && !variantId) {
      toast.error('Please select your size.')
      return
    }
    if (outOfStock) return

    add({
      productId: product.id,
      variantId: selected?.id ?? null,
      name: product.name,
      variantName: selectedSize,
      color: selectedColor,
      unitPrice: price,
      image,
      qty,
    })
    toast.success(lang === 'ET' ? 'ወደ ጋሪ ታክሏል' : 'Added to shopping bag')
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Price Section */}
      <div className="flex items-baseline gap-3">
        <span
          className={cn(
            'text-2xl font-semibold tabular-nums',
            hasDiscount ? 'text-[#c0392b]' : 'text-neutral-900',
          )}
        >
          {formatMoney(price)}
        </span>
        {hasDiscount && (
          <span className="text-sm text-neutral-400 line-through tabular-nums">
            {formatMoney(compareAt as number)}
          </span>
        )}
      </div>

      {product.color && !variants.some((v) => {
        const opts = v.options as Record<string, string> | null
        return Boolean(opts?.color)
      }) && (
        <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-500">
          Color: <span className="font-medium text-neutral-900">{product.color}</span>
        </p>
      )}

      {/* Color + Size Variant Selector */}
      {variants.length > 0 && (
        <ProductColorSizeSelector
          variants={variants}
          trackStock={product.track_stock}
          allowBackorder={product.allow_backorder}
          lowStockThreshold={product.low_stock_threshold}
          selectedVariantId={variantId}
          onVariantSelect={setVariantId}
        />
      )}

      {/* Quantity & Stock Warnings */}
      <div className="flex flex-col space-y-3">
        <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-500">
          Quantity:
        </span>
        <QtyStepper value={qty} onChange={setQty} max={maxQty} />
      </div>

      {hasRestockCountdown && product.restock_at && (
        <RestockCountdown restockAt={product.restock_at} />
      )}
      {product.track_stock && stock > 0 && stock <= product.low_stock_threshold && (
        <p className="text-[11px] font-medium uppercase tracking-wider text-amber-800">
          Low Stock: Only {stock} remaining{selectedSize ? ` in ${selectedSize}` : ''}
        </p>
      )}

      {/* Primary CTA: ADD TO BAG */}
      <button
        type="button"
        disabled={outOfStock || (variants.length > 0 && !variantId)}
        onClick={handleAdd}
        className={cn(
          'flex h-12 w-full items-center justify-center border text-xs font-semibold tracking-[0.2em] uppercase transition-all',
          outOfStock || (variants.length > 0 && !variantId)
            ? 'cursor-not-allowed border-neutral-300 bg-neutral-200 text-neutral-500'
            : 'border-black bg-black text-white hover:bg-neutral-800',
        )}
      >
        {outOfStock
          ? t('out_of_stock', lang)
          : variants.length > 0 && !variantId
          ? 'SELECT A SIZE'
          : 'ADD TO BAG'}
      </button>
    </div>
  )
}
