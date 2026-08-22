import { PackageSearch } from 'lucide-react'
import Link from 'next/link'

import { type Lang } from '@/lib/i18n'
import { getOrgSettings, settingStr } from '@/lib/settings'
import { getSingleStoreOrg } from '@/lib/store-org'
import { getAnonClient } from '@/lib/supabase/anon'
import type { Category, Product } from '@/types/db'
import type { PageProps } from '@/lib/types'

import { EmptyState } from '@/components/ui/empty-state'
import { getProductImages } from '@/components/store/get-product-images'
import { Pagination } from '@/components/store/pagination'
import { ProductCard, type ProductCardData } from '@/components/store/product-card'
import { FilterBar } from '@/components/store/filter-bar'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 24

type ProductRow = Pick<
  Product,
  'id' | 'slug' | 'name' | 'price' | 'compare_at_price' | 'color' | 'tags' | 'track_stock' | 'stock_qty' | 'low_stock_threshold' | 'allow_backorder'
> & { sale_ends_at?: string | null; restock_at?: string | null }

interface VariantSizeRow {
  product_id: string
  stock_qty: number
  options: Record<string, unknown> | null
}

function parseSelections(value?: string) {
  if (!value) return []
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )
}

export default async function ProductsPage({
  searchParams,
}: PageProps<Record<string, never>, { category?: string; q?: string; size?: string; sort?: string; page?: string; tags?: string }>) {
  const { category: categoryParam, q, size: sizeParam, sort, page: pageParam, tags: tagParam } = await searchParams

  const org = await getSingleStoreOrg()
  const settings = await getOrgSettings(org.id)
  const lang = settingStr(settings, 'localization.language') as Lang

  const supabase = getAnonClient()

  // Load categories for filter bar
  const { data: categoryRows } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('org_id', org.id)
    .order('sort_order', { ascending: true })
  const categories = (categoryRows ?? []) as Pick<Category, 'id' | 'name' | 'slug'>[]
  const selectedCategorySlugs = parseSelections(categoryParam)
  const activeCategories = categories.filter((category) => selectedCategorySlugs.includes(category.slug))
  const selectedSizes = parseSelections(sizeParam)

  const { data: variantSizeRows } = await supabase
    .from('product_variants')
    .select('product_id, stock_qty, options')
    .eq('org_id', org.id)

  const variantSizes = (variantSizeRows ?? []) as VariantSizeRow[]
  const availableSizes = Array.from(
    new Set(
      variantSizes
        .map((variant) => variant.options?.size)
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value) => value.trim()),
    ),
  ).sort((left, right) => {
    const order = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
    const leftIndex = order.indexOf(left.toUpperCase())
    const rightIndex = order.indexOf(right.toUpperCase())
    if (leftIndex !== -1 || rightIndex !== -1) return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex)
    return left.localeCompare(right)
  })

  const page = Math.max(1, Number(pageParam) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Product variants are the source of truth for the sizes exposed in this filter.
  // A selected size must have at least one available variant; product status is
  // still applied by the catalog query below.
  let sizeFilterProductIds: string[] | null = null
  if (selectedSizes.length > 0) {
    sizeFilterProductIds = Array.from(
      new Set(
        variantSizes
          .filter((variant) => {
            const size = variant.options?.size
            return typeof size === 'string' && selectedSizes.includes(size) && variant.stock_qty > 0
          })
          .map((variant) => variant.product_id),
      ),
    )
    if (sizeFilterProductIds.length === 0) {
      return (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
          <FilterBar
            categories={categories}
            availableSizes={availableSizes}
            activeCategories={activeCategories.map((category) => category.slug)}
            activeSizes={selectedSizes}
            activeSort={sort}
            query={q}
            totalCount={0}
          />
          <div className="py-20 text-center">
            <EmptyState
              icon={PackageSearch}
              title="No pieces found"
              description="Try adjusting your size, category or keyword search."
            />
          </div>
        </div>
      )
    }
  }

  let query = supabase
    .from('products')
    .select('id, slug, name, price, compare_at_price, color, tags, track_stock, stock_qty, low_stock_threshold, allow_backorder, sale_ends_at, restock_at', {
      count: 'exact',
    })
    .eq('org_id', org.id)
    .eq('status', 'active')

  if (activeCategories.length > 0) query = query.in('category_id', activeCategories.map((category) => category.id))
  if (q) query = query.ilike('name', `%${q}%`)
  if (tagParam) query = query.contains('tags', [tagParam])
  if (sizeFilterProductIds) query = query.in('id', sizeFilterProductIds)

  // Sorting
  if (sort === 'price_asc') {
    query = query.order('price', { ascending: true })
  } else if (sort === 'price_desc') {
    query = query.order('price', { ascending: false })
  } else {
    // Default: newest first
    query = query.order('created_at', { ascending: false })
  }

  const { data, count } = await query.range(from, to)

  const products = (data ?? []) as ProductRow[]
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  const imagesMap = await getProductImages(
    org.id,
    products.map((p) => p.id),
  )

  const pageTitle = activeCategories.length === 1
    ? activeCategories[0].name.toUpperCase()
    : tagParam === 'NEW'
    ? 'NEW IN ARRIVALS'
    : tagParam === 'SALE'
    ? 'SALE'
    : 'ALL COLLECTIONS'

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase text-neutral-400">
        <Link href="/" className="hover:text-black">
          Home
        </Link>
        <span>/</span>
        <span className="text-neutral-900">{pageTitle}</span>
      </nav>

      {/* Page Title & Editorial Header */}
      <div className="mb-8 border-b border-neutral-200 pb-6">
        <h1 className="sf-font-display text-3xl font-normal tracking-tight text-neutral-900 sm:text-5xl">
          {pageTitle}
        </h1>
        <p className="mt-2 max-w-xl text-xs text-neutral-500">
          Explore the currently available pieces from DIR (ድር) THE FOUNDATION.
        </p>
      </div>

      {/* Filter & Sort Bar */}
      <FilterBar
        categories={categories}
        availableSizes={availableSizes}
        activeCategories={activeCategories.map((category) => category.slug)}
        activeSizes={selectedSizes}
        activeSort={sort}
        query={q}
        totalCount={count ?? products.length}
      />

      {products.length === 0 ? (
        <div className="py-20 text-center">
          <EmptyState
            icon={PackageSearch}
            title="No pieces found"
            description="Try selecting a different filter or clearing search."
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-6">
            {products.map((p) => {
              const pair = imagesMap[p.id]
              const card: ProductCardData = {
                ...p,
                image: pair?.primary ?? null,
                secondaryImage: pair?.secondary ?? null,
              }
              return <ProductCard key={p.id} orgSlug={org.slug} product={card} lang={lang} />
            })}
          </div>

          <div className="mt-12 border-t border-neutral-200 pt-6">
            <Pagination
              orgSlug={org.slug}
              page={page}
              totalPages={totalPages}
              query={q}
              category={activeCategories.map((category) => category.slug).join(',') || undefined}
              size={selectedSizes.join(',') || undefined}
              sort={sort}
              tags={tagParam}
            />
          </div>
        </>
      )}
    </div>
  )
}
