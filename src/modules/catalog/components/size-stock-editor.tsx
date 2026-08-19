'use client'

// Simplified size-stock editor for clothing products.
// Renders 5 fixed rows (S/M/L/XL/XXL), each mapping to a VariantRow with
// options: { size: 'M' }. Replaces the generic VariantEditor for clothing.

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fromPaisa } from '@/lib/money'
import { randomKey } from '@/lib/utils'
import type { ProductVariant } from '@/types/db'

import { type VariantInput } from '../schemas'
import { type VariantRow } from './variant-editor'

export const CLOTHING_SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const
export type ClothingSize = (typeof CLOTHING_SIZES)[number]

/** Build a size-keyed map from flat VariantRow[], matched by options.size. */
function toSizeMap(rows: VariantRow[]): Record<string, VariantRow> {
  const map: Record<string, VariantRow> = {}
  for (const row of rows) {
    // Try to find the size in optionsText ("S", "M", etc.) or in the name
    const sizeName = row.optionsText.trim().toUpperCase()
    const sizeFromName = row.name.trim().toUpperCase()
    const key = CLOTHING_SIZES.find((s) => s === sizeName || s === sizeFromName)
    if (key) map[key] = row
  }
  return map
}

/** Convert the 5 size rows back to VariantRow[] (used by ProductForm for saveVariants). */
export function sizeMapToVariantRows(sizeStocks: Record<string, number>, existingRows: VariantRow[], basePrice: number): VariantRow[] {
  const existing = toSizeMap(existingRows)
  return CLOTHING_SIZES.map((size, i) => {
    const prev = existing[size]
    return {
      key: prev?.key ?? randomKey(),
      id: prev?.id,
      name: size,
      price: prev?.price ?? (fromPaisa(basePrice).toFixed(2)),
      compareAtPrice: prev?.compareAtPrice ?? '',
      stockQty: sizeStocks[size] ?? 0,
      isDefault: i === 0,
      optionsText: size, // used by fromVariantRow -> options: { note: size }
    }
  })
}

/** Seed initial size-stock state from existing VariantRows. */
export function variantRowsToSizeStocks(rows: VariantRow[]): Record<string, number> {
  const map = toSizeMap(rows)
  const result: Record<string, number> = {}
  for (const size of CLOTHING_SIZES) {
    result[size] = map[size]?.stockQty ?? 0
  }
  return result
}

interface SizeStockEditorProps {
  value: Record<string, number>
  onChange: (value: Record<string, number>) => void
}

export function SizeStockEditor({ value, onChange }: SizeStockEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Set stock quantity per size. Set to 0 to mark a size as unavailable.
      </p>
      <div className="flex flex-wrap gap-3">
        {CLOTHING_SIZES.map((size) => (
          <div key={size} className="flex flex-col items-center gap-1">
            <Label className="text-xs font-semibold">{size}</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={value[size] ?? 0}
              onChange={(e) => {
                const qty = Math.max(0, parseInt(e.target.value, 10) || 0)
                onChange({ ...value, [size]: qty })
              }}
              className="w-16 text-center"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Convert ProductVariant[] from DB into size-stock map. */
export function variantsToSizeStocks(variants: ProductVariant[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const size of CLOTHING_SIZES) result[size] = 0
  for (const v of variants) {
    const opts = v.options as Record<string, string> | null
    const size = opts?.size?.toUpperCase() as ClothingSize | undefined
    if (size && CLOTHING_SIZES.includes(size)) {
      result[size] = v.stock_qty
    }
  }
  return result
}

/** Build VariantInput[] from size-stock map for saveVariants action. */
export function sizeStocksToVariantInputs(
  sizeStocks: Record<string, number>,
  existingVariants: ProductVariant[],
  basePrice: number,
): VariantInput[] {
  return CLOTHING_SIZES.map((size, i) => {
    const existing = existingVariants.find((v) => {
      const opts = v.options as Record<string, string> | null
      return opts?.size?.toUpperCase() === size
    })
    return {
      id: existing?.id,
      name: size,
      price: existing?.price ?? basePrice,
      compare_at_price: existing?.compare_at_price ?? null,
      stock_qty: sizeStocks[size] ?? 0,
      options: { size },
      is_default: i === 0,
      position: i,
    }
  })
}
