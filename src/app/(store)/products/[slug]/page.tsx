import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'

import { type Lang } from '@/lib/i18n'
import { mediaUrl } from '@/lib/media-url'
import { getOrgSettings, settingStr } from '@/lib/settings'
import { getSingleStoreOrg } from '@/lib/store-org'
import { getAnonClient } from '@/lib/supabase/anon'
import type { PageProps } from '@/lib/types'
import type { Product, ProductVariant } from '@/types/db'

import { ProductGallery } from '@/components/store/product-gallery'
import { ProductPurchasePanel } from '@/components/store/product-purchase-panel'
import { ProductAccordion, type AccordionItem } from '@/components/store/product-accordion'
import { SaleCountdown } from '@/components/store/sale-countdown'
import { getProductImages } from '@/components/store/get-product-images'
import { ProductCard, type ProductCardData } from '@/components/store/product-card'

export const dynamic = 'force-dynamic'

interface ImageJoinRow {
  id: string
  position: number
  media: { path: string } | { path: string }[] | null
}

export async function generateMetadata({
  params,
}: PageProps<{ slug: string }>): Promise<Metadata> {
  const { slug } = await params
  const org = await getSingleStoreOrg()
  const supabase = getAnonClient()
  const { data } = await supabase
    .from('products')
    .select('name, description')
    .eq('org_id', org.id)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()
  if (!data) return {}
  const p = data as { name: string; description: string | null }
  return {
    title: `${p.name} · DIR (ድር) THE FOUNDATION`,
    description: p.description ?? `Shop ${p.name} at ${org.name}.`,
  }
}

export default async function ProductPage({ params }: PageProps<{ slug: string }>) {
  const { slug } = await params
  const org = await getSingleStoreOrg()
  const settings = await getOrgSettings(org.id)
  const lang = settingStr(settings, 'localization.language') as Lang

  const supabase = getAnonClient()
  const { data: productRow } = await supabase
    .from('products')
    .select('*')
    .eq('org_id', org.id)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  if (!productRow) notFound()
  const product = productRow as Product

  const [{ data: variantRows }, { data: imageRows }, { data: relatedRows }] = await Promise.all([
    supabase
      .from('product_variants')
      .select('*')
      .eq('org_id', org.id)
      .eq('product_id', product.id)
      .eq('is_active', true)
      .order('position', { ascending: true }),
    supabase
      .from('product_images')
      .select('id, position, media:media_id(path)')
      .eq('org_id', org.id)
      .eq('product_id', product.id)
      .order('position', { ascending: true }),
    supabase
      .from('products')
      .select('id, slug, name, price, compare_at_price, color, tags, track_stock, stock_qty, low_stock_threshold, allow_backorder, sale_ends_at, restock_at')
      .eq('org_id', org.id)
      .eq('status', 'active')
      .neq('id', product.id)
      .limit(4),
  ])

  const variants = (variantRows ?? []) as ProductVariant[]
  const imageUrls = ((imageRows ?? []) as unknown as ImageJoinRow[])
    .map((row) => {
      const media = Array.isArray(row.media) ? row.media[0] : row.media
      return media?.path ? mediaUrl(media.path) : null
    })
    .filter((url): url is string => Boolean(url))

  const relatedProducts = (relatedRows ?? []) as Product[]
  const relatedImages = await getProductImages(
    org.id,
    relatedProducts.map((p) => p.id),
  )

  const tag = (product.tags ?? [])[0] ?? null
  const isSale = tag === 'SALE'

  // Accordion Content definition
  const accordionItems: AccordionItem[] = [
    {
      id: 'details',
      title: 'Product details',
      defaultOpen: true,
      content: (
        <div className="space-y-2">
          {product.description ? (
            <p className="whitespace-pre-line leading-relaxed">{product.description}</p>
          ) : <p>Product details will be added soon.</p>}
        </div>
      ),
    },
    {
      id: 'sizing',
      title: 'Fit & sizing',
      content: (
        <div className="space-y-1.5 leading-relaxed">
          <p>Select from the available sizes above. Contact us if you need help choosing a size.</p>
        </div>
      ),
    },
    {
      id: 'shipping',
      title: 'Delivery',
      content: (
        <div className="space-y-1.5 leading-relaxed">
          <p>Delivery cost and estimated timing are calculated at checkout after you enter your delivery district.</p>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 flex items-center gap-2 text-[10px] tracking-[0.16em] uppercase text-neutral-400">
        <Link href="/" className="hover:text-black">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-black">
          Catalog
        </Link>
        <span>/</span>
        <span className="text-neutral-900 line-clamp-1">{product.name}</span>
      </nav>

      {/* Main PDP Grid (60% Gallery / 40% Purchase Column) */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Left Gallery (7 cols) */}
        <div className="lg:col-span-7">
          <ProductGallery images={imageUrls} name={product.name} />
        </div>

        {/* Right Purchase Panel & Details (5 cols) */}
        <div className="flex flex-col space-y-6 lg:col-span-5">
          {/* Badge & Brand */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-neutral-400">
              DIR (ድር) THE FOUNDATION
            </span>
            {tag && (
              <span
                className={`px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${
                  tag === 'SALE'
                    ? 'bg-[#c0392b] text-white'
                    : 'bg-black text-white'
                }`}
              >
                {tag}
              </span>
            )}
          </div>

          {/* Product Headline */}
          <h1 className="sf-font-display text-2xl font-normal text-neutral-900 sm:text-3xl">
            {product.name}
          </h1>

          {product.color && <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-neutral-500">Color · <span className="text-neutral-900">{product.color}</span></p>}

          {/* Sale countdown timer if applicable */}
          {isSale && product.sale_ends_at && (
            <SaleCountdown saleEndsAt={product.sale_ends_at} />
          )}

          {/* Purchase Controls */}
          <ProductPurchasePanel
            product={product}
            variants={variants}
            image={imageUrls[0] ?? null}
            lang={lang}
          />

          {/* Accordion Detail Sections */}
          <div className="pt-6">
            <ProductAccordion items={accordionItems} />
          </div>
        </div>
      </div>

      {/* Related Pieces Rail */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 border-t border-neutral-200 pt-12">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="sf-font-display text-xl font-normal uppercase text-neutral-900 sm:text-2xl">
              YOU MAY ALSO LIKE
            </h2>
            <Link
              href="/products"
              className="text-xs font-semibold tracking-[0.14em] uppercase text-neutral-900 hover:text-black"
            >
              View Full Collection →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-6">
            {relatedProducts.map((p) => {
              const pair = relatedImages[p.id]
              const card: ProductCardData = {
                ...p,
                image: pair?.primary ?? null,
                secondaryImage: pair?.secondary ?? null,
              }
              return <ProductCard key={p.id} orgSlug={org.slug} product={card} lang={lang} />
            })}
          </div>
        </section>
      )}
    </div>
  )
}
