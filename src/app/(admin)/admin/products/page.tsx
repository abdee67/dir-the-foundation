import Link from 'next/link'
import { Package, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { requireOrg } from '@/lib/auth'
import { requireModule } from '@/lib/modules'
import { getServerClient } from '@/lib/supabase/server'
import type { PageProps } from '@/lib/types'
import type { ProductStatus } from '@/types/db'

import { ProductList, type ProductListRow } from '@/modules/catalog/components/product-list'

export const dynamic = 'force-dynamic'

const VALID_STATUSES: ProductStatus[] = ['draft', 'active', 'archived']

interface RawProductRow {
  id: string
  name: string
  status: ProductStatus
  price: number
  track_stock: boolean
  stock_qty: number
  low_stock_threshold: number
  restock_at: string | null
  updated_at: string
  category: { name: string } | null
  product_variants: { id: string; price: number }[]
  product_images: { position: number; media: { path: string } | null }[]
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const ctx = await requireOrg()
  requireModule(ctx.org, 'catalog')

  const params = await searchParams
  const statusParam = typeof params.status === 'string' ? params.status : undefined
  const status = VALID_STATUSES.includes(statusParam as ProductStatus) ? (statusParam as ProductStatus) : 'all'

  const supabase = await getServerClient()
  let query = supabase
    .from('products')
    .select(
      `id, name, status, price, track_stock, stock_qty, low_stock_threshold, restock_at, updated_at,
       category:categories(name),
       product_variants(id, price),
       product_images(position, media:media(path))`,
    )
    .eq('org_id', ctx.org.id)
    .order('position', { ascending: true })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  const rows: ProductListRow[] = ((data ?? []) as unknown as RawProductRow[]).map((p) => {
    const variantPrices = (p.product_variants ?? []).map((v) => v.price)
    const images = (p.product_images ?? []).slice().sort((a, b) => a.position - b.position)

    return {
      id: p.id,
      name: p.name,
      status: p.status,
      price: p.price,
      track_stock: p.track_stock,
      stock_qty: p.stock_qty,
      low_stock_threshold: p.low_stock_threshold,
      restock_at: p.restock_at,
      updated_at: p.updated_at,
      categoryName: p.category?.name ?? null,
      variantCount: variantPrices.length,
      minVariantPrice: variantPrices.length ? Math.min(...variantPrices) : null,
      thumbPath: images[0]?.media?.path ?? null,
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Manage product information, pricing, imagery, and availability."
        actions={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="size-4" />
              New product
            </Link>
          </Button>
        }
      />

      {error ? (
        <EmptyState icon={Package} title="Couldn't load products" description={error.message} />
      ) : rows.length === 0 && status === 'all' ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add your first product to start building your catalog."
          action={
            <Button asChild>
              <Link href="/admin/products/new">New product</Link>
            </Button>
          }
        />
      ) : (
        <ProductList products={rows} status={status} />
      )}
    </div>
  )
}
