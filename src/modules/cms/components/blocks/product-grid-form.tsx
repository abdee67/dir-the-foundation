'use client'

import * as React from 'react'
import { X } from 'lucide-react'

import type { ProductGridBlock } from '@/types/db'
import { getProductsByIdsAction, searchProductsAction } from '@/modules/cms/actions'
import type { ProductLite } from '@/modules/cms/schemas'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CategoryOption } from '../block-meta'
import { Field } from './field'

interface ProductGridFormProps {
  block: ProductGridBlock
  categories: CategoryOption[]
  onChange: (next: ProductGridBlock) => void
}

function ProductGridForm({ block, categories, onChange }: ProductGridFormProps) {
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<ProductLite[]>([])
  const [selectedNames, setSelectedNames] = React.useState<Record<string, string>>({})

  const productIds = React.useMemo(() => block.productIds ?? [], [block.productIds])

  React.useEffect(() => {
    if (block.mode !== 'manual' || productIds.length === 0) return
    const missing = productIds.filter((id) => !selectedNames[id])
    if (missing.length === 0) return
    void getProductsByIdsAction(missing).then((result) => {
      if (!result.ok) return
      setSelectedNames((prev) => {
        const next = { ...prev }
        for (const product of result.data ?? []) next[product.id] = product.name
        return next
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.mode, productIds])

  React.useEffect(() => {
    if (block.mode !== 'manual') return
    const handle = setTimeout(() => {
      void searchProductsAction(query).then((result) => {
        if (result.ok) setResults(result.data ?? [])
      })
    }, 250)
    return () => clearTimeout(handle)
  }, [query, block.mode])

  function addProduct(product: ProductLite) {
    if (productIds.includes(product.id)) return
    setSelectedNames((prev) => ({ ...prev, [product.id]: product.name }))
    onChange({ ...block, productIds: [...productIds, product.id] })
  }

  function removeProduct(id: string) {
    onChange({ ...block, productIds: productIds.filter((pid) => pid !== id) })
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Title">
        <Input value={block.title ?? ''} onChange={(e) => onChange({ ...block, title: e.target.value })} />
      </Field>

      <Field label="Source">
        <Select
          value={block.mode}
          onValueChange={(value) => onChange({ ...block, mode: value as ProductGridBlock['mode'] })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="category">A category</SelectItem>
            <SelectItem value="manual">Hand-picked products</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {block.mode === 'category' ? (
        <Field label="Category">
          <Select
            value={block.categoryId ?? ''}
            onValueChange={(value) => onChange({ ...block, categoryId: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}

      {block.mode === 'manual' ? (
        <Field label="Products" help="Search and add products to feature, in order.">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." />
          {results.length > 0 ? (
            <div className="flex flex-col gap-1 rounded-md border p-1.5">
              {results.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProduct(product)}
                  disabled={productIds.includes(product.id)}
                  className="flex items-center justify-between rounded px-2 py-1 text-left text-[13px] hover:bg-accent disabled:opacity-40"
                >
                  <span>{product.name}</span>
                </button>
              ))}
            </div>
          ) : null}
          {productIds.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {productIds.map((id) => (
                <Badge key={id} variant="secondary" className="gap-1 pr-1">
                  {selectedNames[id] ?? id}
                  <button type="button" onClick={() => removeProduct(id)}>
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : null}
        </Field>
      ) : null}

      <Field label="Limit">
        <Input
          type="number"
          min={1}
          value={block.limit ?? ''}
          onChange={(e) => onChange({ ...block, limit: e.target.value ? Number(e.target.value) : undefined })}
        />
      </Field>
    </div>
  )
}

export { ProductGridForm }
