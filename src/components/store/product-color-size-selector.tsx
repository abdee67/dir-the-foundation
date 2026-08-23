'use client'

// Storefront color + size selector for clothing products.
// Dynamically updates size availability based on selected color.
// Supports both size-only (legacy) and color×size (new) variant modes.

import { useEffect, useMemo, useState } from 'react'

import { cn } from '@/lib/utils'

// Flexible variant interface that works with both ProductVariant and PublicRevealVariant
interface VariantLike {
  id: string
  name: string
  stock_qty?: number
  stockQty?: number
  options: Record<string, unknown>
}

interface ColorSizeSelectorProps {
  variants: VariantLike[]
  trackStock: boolean
  allowBackorder: boolean
  lowStockThreshold?: number
  selectedVariantId: string | null
  onVariantSelect: (variantId: string | null) => void
  className?: string
}

interface ColorOption {
  color: string
  availableSizes: Set<string>
  totalStock: number
}

interface SizeOption {
  size: string
  variantId: string
  stock: number
  available: boolean
}

export function ProductColorSizeSelector({
  variants,
  trackStock,
  allowBackorder,
  lowStockThreshold = 5,
  selectedVariantId,
  onVariantSelect,
  className,
}: ColorSizeSelectorProps) {
  // Normalize stock_qty vs stockQty
  const normalizedVariants = useMemo(() => {
    return variants.map((v) => ({
      ...v,
      stock_qty: v.stock_qty ?? v.stockQty ?? 0,
    }))
  }, [variants])

  // Determine if this product has color variants
  const hasColorVariants = useMemo(() => {
    return normalizedVariants.some((v) => {
      const opts = v.options as Record<string, string> | null
      return Boolean(opts?.color)
    })
  }, [normalizedVariants])

  // Build color options map
  const colorOptions = useMemo<ColorOption[]>(() => {
    if (!hasColorVariants) return []

    const colorMap = new Map<string, ColorOption>()

    for (const variant of normalizedVariants) {
      const opts = variant.options as Record<string, string> | null
      const color = opts?.color?.trim()
      const size = opts?.size?.trim()

      if (!color || !size) continue

      if (!colorMap.has(color)) {
        colorMap.set(color, {
          color,
          availableSizes: new Set(),
          totalStock: 0,
        })
      }

      const colorOpt = colorMap.get(color)!
      const isAvailable = !trackStock || variant.stock_qty > 0 || allowBackorder

      if (isAvailable) {
        colorOpt.availableSizes.add(size)
      }
      colorOpt.totalStock += variant.stock_qty
    }

    return Array.from(colorMap.values()).sort((a, b) => a.color.localeCompare(b.color))
  }, [normalizedVariants, hasColorVariants, trackStock, allowBackorder])

  // Get selected variant details
  const selectedVariant = useMemo(() => {
    return normalizedVariants.find((v) => v.id === selectedVariantId) ?? null
  }, [normalizedVariants, selectedVariantId])

  const selectedColor = useMemo(() => {
    if (!selectedVariant) return null
    const opts = selectedVariant.options as Record<string, string> | null
    return opts?.color?.trim() ?? null
  }, [selectedVariant])

  // A color is an intermediate choice, while the selected variant is the final
  // color + size combination. Keep it separately so choosing a color can clear
  // the size without losing the color that should filter the next choices.
  const [activeColor, setActiveColor] = useState<string | null>(() => selectedColor)

  useEffect(() => {
    if (selectedColor) setActiveColor(selectedColor)
  }, [selectedColor])

  useEffect(() => {
    if (activeColor && !colorOptions.some((option) => option.color.toLowerCase() === activeColor.toLowerCase())) {
      setActiveColor(null)
    }
  }, [activeColor, colorOptions])

  const selectedSize = useMemo(() => {
    if (!selectedVariant) return null
    const opts = selectedVariant.options as Record<string, string> | null
    return opts?.size?.trim() ?? null
  }, [selectedVariant])

  // Build size options for selected color (or all sizes if no color variants)
  const sizeOptions = useMemo<SizeOption[]>(() => {
    const filtered = hasColorVariants && activeColor
      ? normalizedVariants.filter((v) => {
          const opts = v.options as Record<string, string> | null
          return opts?.color?.trim().toLowerCase() === activeColor.toLowerCase()
        })
      : normalizedVariants

    return filtered
      .map((v) => {
        const opts = v.options as Record<string, string> | null
        const size = opts?.size?.trim() ?? v.name
        const available = !trackStock || v.stock_qty > 0 || allowBackorder

        return {
          size,
          variantId: v.id,
          stock: v.stock_qty,
          available,
        }
      })
      .sort((a, b) => {
        // Sort by standard size order: XS, S, M, L, XL, XXL
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
        const aIndex = sizeOrder.indexOf(a.size.toUpperCase())
        const bIndex = sizeOrder.indexOf(b.size.toUpperCase())
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        return a.size.localeCompare(b.size)
      })
  }, [normalizedVariants, hasColorVariants, activeColor, trackStock, allowBackorder])

  function handleColorSelect(color: string) {
    setActiveColor(color)
    // A color alone is not a purchasable variant. Require a size from this
    // color before the parent considers the selection complete.
    onVariantSelect(null)
  }

  function handleSizeSelect(variantId: string, available: boolean) {
    if (!available) return
    onVariantSelect(variantId)
  }

  // Size-only mode (no colors)
  if (!hasColorVariants) {
    return (
      <div className={cn('flex flex-col space-y-3', className)}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-500">
            Select Size:
          </span>
          <span className="text-[10px] uppercase tracking-[0.12em] text-neutral-400">
            Available sizes
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {sizeOptions.map((sizeOpt) => {
            const isSelected = sizeOpt.variantId === selectedVariantId
            const isLowStock = trackStock && sizeOpt.stock > 0 && sizeOpt.stock <= lowStockThreshold

            return (
              <button
                key={sizeOpt.variantId}
                type="button"
                disabled={!sizeOpt.available}
                onClick={() => handleSizeSelect(sizeOpt.variantId, sizeOpt.available)}
                className={cn(
                  'flex h-11 min-w-[48px] items-center justify-center border px-3 text-xs font-semibold tracking-wider transition-colors',
                  isSelected
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-200 bg-white text-neutral-900 hover:border-black',
                  !sizeOpt.available && 'cursor-not-allowed border-neutral-100 bg-neutral-50 text-neutral-300 line-through opacity-60',
                )}
                aria-label={`Size ${sizeOpt.size}${isLowStock ? ', low stock' : ''}${!sizeOpt.available ? ', out of stock' : ''}`}
              >
                {sizeOpt.size}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Color×Size mode
  return (
    <div className={cn('flex flex-col space-y-5', className)}>
      {/* Color Selector */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-500">
            Select Color:
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {colorOptions.map((colorOpt) => {
            const isSelected = activeColor?.toLowerCase() === colorOpt.color.toLowerCase()
            const hasStock = colorOpt.totalStock > 0 || allowBackorder
            const isDisabled = !hasStock && trackStock

            return (
              <button
                key={colorOpt.color}
                type="button"
                disabled={isDisabled}
                onClick={() => handleColorSelect(colorOpt.color)}
                className={cn(
                  'flex h-11 min-w-[80px] items-center justify-center border px-4 text-xs font-semibold tracking-wider transition-colors',
                  isSelected
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-200 bg-white text-neutral-900 hover:border-black',
                  isDisabled && 'cursor-not-allowed border-neutral-100 bg-neutral-50 text-neutral-300 opacity-60',
                )}
                aria-label={`Color ${colorOpt.color}${isDisabled ? ', out of stock' : ''}`}
              >
                {colorOpt.color}
              </button>
            )
          })}
        </div>
      </div>

      {/* Size Selector (only shown when color is selected) */}
      {activeColor && (
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-500">
              Select Size:
            </span>
            <span className="text-[10px] uppercase tracking-[0.12em] text-neutral-400">
              Available in {activeColor}
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {sizeOptions.map((sizeOpt) => {
              const isSelected = sizeOpt.variantId === selectedVariantId
              const isLowStock = trackStock && sizeOpt.stock > 0 && sizeOpt.stock <= lowStockThreshold

              return (
                <button
                  key={sizeOpt.variantId}
                  type="button"
                  disabled={!sizeOpt.available}
                  onClick={() => handleSizeSelect(sizeOpt.variantId, sizeOpt.available)}
                  className={cn(
                    'flex h-11 min-w-[48px] items-center justify-center border px-3 text-xs font-semibold tracking-wider transition-colors',
                    isSelected
                      ? 'border-black bg-black text-white'
                      : 'border-neutral-200 bg-white text-neutral-900 hover:border-black',
                    !sizeOpt.available && 'cursor-not-allowed border-neutral-100 bg-neutral-50 text-neutral-300 line-through opacity-60',
                  )}
                  aria-label={`Size ${sizeOpt.size}${isLowStock ? ', low stock' : ''}${!sizeOpt.available ? ', out of stock' : ''}`}
                >
                  {sizeOpt.size}
                </button>
              )
            })}
          </div>

          {sizeOptions.every((s) => !s.available) && (
            <p className="text-xs text-red-600 font-medium uppercase tracking-wider">
              All sizes out of stock in {activeColor}
            </p>
          )}
        </div>
      )}

      {/* Prompt to select color if none selected */}
      {!activeColor && (
        <p className="text-xs text-muted-foreground italic">
          Please select a color to view available sizes
        </p>
      )}
    </div>
  )
}
