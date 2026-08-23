'use client'

// Color × Size variant matrix editor for clothing products.
// Admin can configure colors and manage stock per color×size combination.
// Generates VariantInput[] for saveVariants action.

import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ProductVariant } from '@/types/db'

import type { VariantInput } from '../schemas'

const DEFAULT_CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export interface ColorSizeStock {
  color: string
  sizeStock: Record<string, number>
}

interface ColorSizeMatrixEditorProps {
  value: ColorSizeStock[]
  onChange: (value: ColorSizeStock[]) => void
}

export function ColorSizeMatrixEditor({ value, onChange }: ColorSizeMatrixEditorProps) {
  const [newColorInput, setNewColorInput] = useState('')
  const [newSizeInput, setNewSizeInput] = useState('')
  const sizes = useMemo(
    () => [...new Set(value.flatMap((color) => Object.keys(color.sizeStock)))],
    [value],
  )

  function handleAddColor() {
    const trimmed = newColorInput.trim()
    if (!trimmed) return
    if (value.some((c) => c.color.toLowerCase() === trimmed.toLowerCase())) {
      return // duplicate
    }

    const newColor: ColorSizeStock = {
      color: trimmed,
      sizeStock: (sizes.length > 0 ? sizes : DEFAULT_CLOTHING_SIZES).reduce<Record<string, number>>(
        (stock, size) => ({ ...stock, [size]: 0 }),
        {},
      ),
    }

    onChange([...value, newColor])
    setNewColorInput('')
  }

  function handleRemoveColor(color: string) {
    onChange(value.filter((c) => c.color !== color))
  }

  function handleStockChange(color: string, size: string, qty: number) {
    onChange(
      value.map((c) =>
        c.color === color
          ? { ...c, sizeStock: { ...c.sizeStock, [size]: Math.max(0, qty) } }
          : c
      )
    )
  }

  function handleAddSize() {
    const size = newSizeInput.trim().toUpperCase()
    if (!size || sizes.some((value) => value.toUpperCase() === size)) return
    onChange(value.map((color) => ({ ...color, sizeStock: { ...color.sizeStock, [size]: 0 } })))
    setNewSizeInput('')
  }

  function handleRemoveSize(size: string) {
    onChange(value.map((color) => {
      const { [size]: _removed, ...sizeStock } = color.sizeStock
      return { ...color, sizeStock }
    }))
  }

  if (value.length === 0) {
    return (
      <div className="flex flex-col gap-4 rounded-md border border-dashed p-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Color Variants</h3>
          <p className="text-xs text-muted-foreground">
            Add colors to enable color × size inventory management. Each color starts with standard sizes, which you can customize after adding it.
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="e.g. Black, White, Navy..."
            value={newColorInput}
            onChange={(e) => setNewColorInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddColor()
              }
            }}
            className="max-w-xs"
          />
          <Button type="button" onClick={handleAddColor} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Color
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">Color × Size Inventory Matrix</h3>
          <p className="text-xs text-muted-foreground">
            Manage stock quantity for each color and size combination. Set to 0 to mark as unavailable.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Add another color..."
          value={newColorInput}
          onChange={(e) => setNewColorInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddColor()
            }
          }}
          className="max-w-xs"
        />
        <Button type="button" onClick={handleAddColor} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Add Color
        </Button>
        <Input
          placeholder="Add size (e.g. 3XL)"
          value={newSizeInput}
          onChange={(e) => setNewSizeInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddSize()
            }
          }}
          className="max-w-xs"
        />
        <Button type="button" onClick={handleAddSize} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Add Size
        </Button>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Color</th>
              {sizes.map((size) => (
                <th key={size} className="p-3 text-center text-xs font-semibold uppercase tracking-wider">
                  <span>{size}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSize(size)}
                    className="ml-1 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${size} size`}
                  >
                    ×
                  </button>
                </th>
              ))}
              <th className="p-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {value.map((colorStock, colorIndex) => (
              <tr key={colorStock.color} className={cn('border-b', colorIndex % 2 === 0 ? 'bg-white' : 'bg-muted/20')}>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{colorStock.color}</span>
                  </div>
                </td>
                {sizes.map((size) => (
                  <td key={size} className="p-2 text-center">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={colorStock.sizeStock[size] ?? 0}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value, 10) || 0
                        handleStockChange(colorStock.color, size, qty)
                      }}
                      className={cn(
                        'w-16 text-center tabular-nums',
                        colorStock.sizeStock[size] === 0 && 'bg-red-50 text-red-600',
                        colorStock.sizeStock[size] > 0 && colorStock.sizeStock[size] <= 3 && 'bg-amber-50 text-amber-700',
                        colorStock.sizeStock[size] > 3 && 'bg-green-50 text-green-700'
                      )}
                    />
                  </td>
                ))}
                <td className="p-2 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveColor(colorStock.color)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stock Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-red-100 border border-red-200" />
          <span>Out of Stock</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-amber-100 border border-amber-200" />
          <span>Low Stock (1-3)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-green-100 border border-green-200" />
          <span>In Stock (4+)</span>
        </div>
      </div>
    </div>
  )
}

/** Convert ProductVariant[] from DB into ColorSizeStock[]. */
export function variantsToColorSizeMatrix(variants: ProductVariant[]): ColorSizeStock[] {
  const colorMap = new Map<string, Record<string, number>>()

  for (const variant of variants) {
    const opts = variant.options as Record<string, string> | null
    const color = opts?.color?.trim()
    const size = opts?.size?.trim().toUpperCase()

    if (!color || !size) continue

    if (!colorMap.has(color)) {
      colorMap.set(color, {})
    }

    const sizeStock = colorMap.get(color)!
    sizeStock[size] = variant.stock_qty
  }

  return Array.from(colorMap.entries()).map(([color, sizeStock]) => ({ color, sizeStock }))
}

/** Build VariantInput[] from ColorSizeStock[] for saveVariants action. */
export function colorSizeMatrixToVariantInputs(
  matrix: ColorSizeStock[],
  existingVariants: ProductVariant[],
  basePrice: number,
): VariantInput[] {
  const inputs: VariantInput[] = []
  let position = 0

  for (const colorStock of matrix) {
    for (const [size, stockQty] of Object.entries(colorStock.sizeStock)) {
      const existing = existingVariants.find((v) => {
        const opts = v.options as Record<string, string> | null
        return opts?.color?.toLowerCase() === colorStock.color.toLowerCase() && opts?.size?.toUpperCase() === size
      })

      inputs.push({
        id: existing?.id,
        name: `${colorStock.color} / ${size}`,
        price: existing?.price ?? basePrice,
        compare_at_price: existing?.compare_at_price ?? null,
        stock_qty: stockQty,
        options: { color: colorStock.color, size },
        is_default: position === 0,
        position,
      })

      position++
    }
  }

  return inputs
}
