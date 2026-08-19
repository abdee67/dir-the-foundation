'use client'

// "Adjust stock" dialog: product search (Command+Popover combobox) -> variant
// select if the product has any -> qty delta + note -> adjustStock action.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, PackagePlus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { adjustStock } from '../actions'

export interface StockAdjustProduct {
  id: string
  name: string
  trackStock: boolean
  stockQty: number
  variants: { id: string; name: string; stockQty: number }[]
}

interface AdjustStockDialogProps {
  products: StockAdjustProduct[]
}

const NO_VARIANT = '__product_level__'

function AdjustStockDialog({ products }: AdjustStockDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [productId, setProductId] = useState<string | null>(null)
  const [variantId, setVariantId] = useState<string>(NO_VARIANT)
  const [delta, setDelta] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedProduct = products.find((p) => p.id === productId) ?? null

  function reset() {
    setProductId(null)
    setVariantId(NO_VARIANT)
    setDelta('')
    setNote('')
  }

  async function handleSubmit() {
    if (!selectedProduct) {
      toast.error('Choose a product')
      return
    }
    const qtyDelta = Number(delta)
    if (!Number.isInteger(qtyDelta) || qtyDelta === 0) {
      toast.error('Enter a non-zero whole number')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await adjustStock({
        product_id: selectedProduct.id,
        variant_id: variantId === NO_VARIANT ? null : variantId,
        qty_delta: qtyDelta,
        note: note.trim() ? note.trim() : null,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Stock adjusted')
      setOpen(false)
      reset()
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button type="button">
          <PackagePlus className="size-4" />
          Adjust stock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label>Product</Label>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-between font-normal">
                  {selectedProduct ? selectedProduct.name : 'Search products...'}
                  <ChevronsUpDown className="text-muted-foreground size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search products..." />
                  <CommandList>
                    <CommandEmpty>No products found.</CommandEmpty>
                    <CommandGroup>
                      {products.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.name}
                          onSelect={() => {
                            setProductId(p.id)
                            setVariantId(NO_VARIANT)
                            setPickerOpen(false)
                          }}
                        >
                          <Check className={cn('size-4', p.id === productId ? 'opacity-100' : 'opacity-0')} />
                          <span className="flex flex-1 flex-col">
                            <span>{p.name}</span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selectedProduct && selectedProduct.variants.length > 0 ? (
            <div className="flex flex-col gap-1">
              <Label>Variant</Label>
              <Select value={variantId} onValueChange={setVariantId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_VARIANT}>Product-level stock ({selectedProduct.stockQty})</SelectItem>
                  {selectedProduct.variants.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} ({v.stockQty})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {selectedProduct && !selectedProduct.trackStock ? (
            <p className="text-muted-foreground text-xs">
              This product doesn&apos;t track stock — the movement is still logged.
            </p>
          ) : null}

          <div className="flex flex-col gap-1">
            <Label>Quantity change</Label>
            <Input value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="e.g. 10 or -3" inputMode="numeric" />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Note</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Reason for this adjustment" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save adjustment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { AdjustStockDialog }
