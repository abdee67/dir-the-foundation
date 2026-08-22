'use client'

// Shared create/edit product form (docs/conventions.md — Forms: RHF +
// zodResolver + ui/form helpers). Base fields are one RHF form; variants and
// images are separate controlled-array editors saved via their own actions
// (saveVariants/saveImages) right after createProduct/updateProduct resolves
// — see the module-level submit orchestration below.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { fromPaisa, toPaisa } from '@/lib/money'
import { slugify } from '@/lib/utils'
import type { Product, ProductImage, ProductVariant } from '@/types/db'

import { createProduct, deleteProduct, saveImages, saveVariants, updateProduct } from '../actions'
import { productFormSchema, type ProductActionInput, type ProductFormValues } from '../schemas'
import { ImageGallery, fromImageRow, toImageRow, type ImageRow } from './image-gallery'
import { VariantEditor, fromVariantRow, newVariantRow, toVariantRow, type VariantRow } from './variant-editor'
import { SizeStockEditor, sizeStocksToVariantInputs, variantsToSizeStocks } from './size-stock-editor'
import type { CategoryOption } from '../category-options'

interface ProductFormProps {
  mode: 'create' | 'edit'
  product?: Product
  variants?: ProductVariant[]
  images?: (ProductImage & { path: string })[]
  categories: CategoryOption[]
}

const NONE_CATEGORY = '__none__'

function toFormValues(product?: Product): ProductFormValues {
  if (!product) {
    return {
      name: '',
      slug: '',
      description: '',
      brand: '',
      color: '',
      category_id: null,
      status: 'draft',
      price: '',
      compare_at_price: '',
      cost_price: '',
      track_stock: true,
      stock_qty: 0,
      low_stock_threshold: 5,
      allow_backorder: false,
      tags: '',
      sale_ends_at: '',
      restock_at: '',
    }
  }

  return {
    name: product.name,
    slug: product.slug,
    description: product.description ?? '',
    brand: product.brand ?? '',
    color: product.color ?? '',
    category_id: product.category_id,
    status: product.status,
    price: fromPaisa(product.price).toFixed(2),
    compare_at_price: product.compare_at_price != null ? fromPaisa(product.compare_at_price).toFixed(2) : '',
    cost_price: product.cost_price != null ? fromPaisa(product.cost_price).toFixed(2) : '',
    track_stock: product.track_stock,
    stock_qty: product.stock_qty,
    low_stock_threshold: product.low_stock_threshold,
    allow_backorder: product.allow_backorder,
    // Single tag — take first from array
    tags: (product.tags ?? [])[0] ?? '',
    // sale_ends_at: convert UTC ISO to local datetime-local value
    sale_ends_at: (product as Product & { sale_ends_at?: string | null }).sale_ends_at
      ? new Date((product as Product & { sale_ends_at?: string | null }).sale_ends_at!).toISOString().slice(0, 16)
      : '',
    restock_at: product.restock_at ? new Date(product.restock_at).toISOString().slice(0, 16) : '',
  }
}

function toActionInput(values: ProductFormValues): ProductActionInput {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description?.trim() ? values.description.trim() : null,
    brand: values.brand?.trim() ? values.brand.trim() : null,
    color: values.color?.trim() ? values.color.trim() : null,
    category_id: values.category_id,
    status: values.status,
    price: toPaisa(values.price),
    compare_at_price: values.compare_at_price?.trim() ? toPaisa(values.compare_at_price) : null,
    cost_price: values.cost_price?.trim() ? toPaisa(values.cost_price) : null,
    track_stock: values.track_stock,
    stock_qty: values.stock_qty,
    low_stock_threshold: values.low_stock_threshold,
    allow_backorder: values.allow_backorder,
    // Single tag stored as array for backward compat
    tags: values.tags?.trim() ? [values.tags.trim()] : [],
    // Convert local datetime-local string to UTC ISO
    sale_ends_at: values.sale_ends_at?.trim()
      ? new Date(values.sale_ends_at).toISOString()
      : null,
    restock_at: values.restock_at?.trim()
      ? new Date(values.restock_at).toISOString()
      : null,
  }
}

function ProductForm({ mode, product, variants, images, categories }: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [variantRows, setVariantRows] = useState<VariantRow[]>(() => (variants ?? []).map(toVariantRow))
  const [hasVariants, setHasVariants] = useState((variants?.length ?? 0) > 0)
  const [imageRows, setImageRows] = useState<ImageRow[]>(() => (images ?? []).map(toImageRow))

  // Clothing-store size stock state
  const [sizeStocks, setSizeStocks] = useState<Record<string, number>>(() =>
    variantsToSizeStocks(variants ?? []),
  )

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: toFormValues(product),
  })

  const persistedVariantOptions = variantRows
    .filter((row): row is VariantRow & { id: string } => Boolean(row.id))
    .map((row) => ({ id: row.id, name: row.name || 'Unnamed' }))

  function handleNameChange(value: string) {
    form.setValue('name', value)
    form.setValue('slug', slugify(value), { shouldValidate: true })
  }

  async function onSubmit(values: ProductFormValues) {
    startTransition(async () => {
      const input = toActionInput(values)
      const result = mode === 'create' ? await createProduct(input) : await updateProduct(product!.id, input)

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      const productId = mode === 'create' ? result.data!.id : product!.id

      // Build variant inputs from size stocks (clothing store always uses size variants)
      const priceInPaisa = toPaisa(values.price)
      const sizeVariantInputs = sizeStocksToVariantInputs(sizeStocks, variants ?? [], priceInPaisa)

      const [variantsResult, imagesResult] = await Promise.all([
        saveVariants({
          product_id: productId,
          variants: sizeVariantInputs,
        }),
        saveImages({
          product_id: productId,
          images: imageRows.map((row, i) => fromImageRow(row, i)),
        }),
      ])

      if (!variantsResult.ok) {
        toast.error(`Product saved, but variants failed: ${variantsResult.error}`)
        return
      }
      if (!imagesResult.ok) {
        toast.error(`Product saved, but images failed: ${imagesResult.error}`)
        return
      }

      toast.success(mode === 'create' ? 'Product created' : 'Product updated')

      if (mode === 'create') {
        router.push(`/admin/products/${productId}`)
      } else {
        router.refresh()
      }
    })
  }

  async function handleDelete() {
    if (!product) return
    const result = await deleteProduct(product.id)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Product deleted')
    router.push('/admin/products')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Card className="gap-4 p-4">
              <CardHeader className="p-0">
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 p-0">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} onChange={(e) => handleNameChange(e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Espresso" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          value={field.value ?? NONE_CATEGORY}
                          onValueChange={(v) => field.onChange(v === NONE_CATEGORY ? null : v)}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="No category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NONE_CATEGORY}>No category</SelectItem>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.parentName ? `${c.parentName} / ${c.name}` : c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="gap-4 p-4">
              <CardHeader className="p-0">
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ImageGallery value={imageRows} onChange={setImageRows} variantOptions={persistedVariantOptions} />
              </CardContent>
            </Card>

            <Card className="gap-4 p-4">
              <CardHeader className="flex-row items-center justify-between p-0">
                <CardTitle>Size &amp; Stock</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <SizeStockEditor value={sizeStocks} onChange={setSizeStocks} />
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="gap-4 p-4">
              <CardHeader className="p-0">
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 p-0">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Sale expiration — shown only when tag is SALE */}
                <FormField
                  control={form.control}
                  name="sale_ends_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale ends at (optional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Leave blank for no expiry. Used by the storefront countdown timer.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="gap-4 p-4">
              <CardHeader className="p-0">
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 p-0">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (ETB)</FormLabel>
                      <FormControl>
                        <Input inputMode="decimal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="compare_at_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compare-at price (ETB)</FormLabel>
                      <FormControl>
                        <Input inputMode="decimal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cost_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost price (ETB)</FormLabel>
                      <FormControl>
                        <Input inputMode="decimal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="gap-4 p-4">
              <CardHeader className="p-0">
                <CardTitle>Inventory</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 p-0">
                <FormField
                  control={form.control}
                  name="track_stock"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between gap-2">
                      <FormLabel className="text-foreground text-xs">Track stock</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stock_qty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock qty</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={String(field.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="low_stock_threshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low stock at</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={String(field.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="allow_backorder"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between gap-2">
                      <FormLabel className="text-foreground text-xs">Allow backorder</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="restock_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected restock (optional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Communication only; update actual stock when the product arrives.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Tag</FormLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="No tag" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">No tag</SelectItem>
                          <SelectItem value="NEW">NEW</SelectItem>
                          <SelectItem value="SALE">SALE</SelectItem>
                          <SelectItem value="BEST SELLER">BEST SELLER</SelectItem>
                          <SelectItem value="TRENDING">TRENDING</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div>
            {mode === 'edit' && product ? (
              <ConfirmDialog
                trigger={
                  <Button type="button" variant="outline">
                    Delete product
                  </Button>
                }
                title="Delete this product?"
                description={`"${product.name}" will be permanently removed. Past orders keep their own snapshot and are unaffected.`}
                confirmLabel="Delete"
                destructive
                onConfirm={handleDelete}
              />
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : mode === 'create' ? 'Create product' : 'Save changes'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}

export { ProductForm }
