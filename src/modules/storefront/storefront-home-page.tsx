import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { getOrgSettings, settingStr } from '@/lib/settings'
import { mediaUrl } from '@/lib/media-url'
import { getSingleStoreOrg } from '@/lib/store-org'
import { getAnonClient } from '@/lib/supabase/anon'
import type { Category, Product } from '@/types/db'

import { getProductImages } from '@/components/store/get-product-images'
import { ProductCard, type ProductCardData } from '@/components/store/product-card'
import { type Lang } from '@/lib/i18n'

type ProductRow = Pick<
  Product,
  | 'id'
  | 'slug'
  | 'name'
  | 'price'
  | 'compare_at_price'
  | 'tags'
  | 'track_stock'
  | 'stock_qty'
  | 'low_stock_threshold'
  | 'allow_backorder'
> & { sale_ends_at?: string | null; restock_at?: string | null }

const PRODUCT_FIELDS = 'id, slug, name, price, compare_at_price, tags, track_stock, stock_qty, low_stock_threshold, allow_backorder, sale_ends_at, restock_at'

export async function StorefrontHomePage() {
  const org = await getSingleStoreOrg()
  const settings = await getOrgSettings(org.id)
  const lang = settingStr(settings, 'localization.language') as Lang
  const supabase = getAnonClient()

  const [{ data: categoryRows }, { data: newRows }, { data: saleRows }, { data: latestRows }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').eq('org_id', org.id).order('sort_order', { ascending: true }),
    supabase.from('products').select(PRODUCT_FIELDS).eq('org_id', org.id).eq('status', 'active').contains('tags', ['NEW']).order('created_at', { ascending: false }).limit(8),
    supabase.from('products').select(PRODUCT_FIELDS).eq('org_id', org.id).eq('status', 'active').contains('tags', ['SALE']).order('created_at', { ascending: false }).limit(4),
    supabase.from('products').select(PRODUCT_FIELDS).eq('org_id', org.id).eq('status', 'active').order('created_at', { ascending: false }).limit(8),
  ])

  const categories = (categoryRows ?? []) as Pick<Category, 'id' | 'name' | 'slug'>[]
  const categoryQueries = await Promise.all(
    categories.map(async (category) => ({
      category,
      products: ((await supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .eq('org_id', org.id)
        .eq('status', 'active')
        .eq('category_id', category.id)
        .order('created_at', { ascending: false })
        .limit(4)).data ?? []) as ProductRow[],
    })),
  )

  const newArrivals = (newRows ?? []) as ProductRow[]
  const saleProducts = (saleRows ?? []) as ProductRow[]
  const latestProducts = (latestRows ?? []) as ProductRow[]
  const categorySections = categoryQueries.filter((section) => section.products.length > 0)
  const imageProductIds = [
    ...newArrivals,
    ...saleProducts,
    ...latestProducts,
    ...categorySections.flatMap((section) => section.products),
  ].map((product) => product.id)
  const images = await getProductImages(org.id, [...new Set(imageProductIds)])

  function toCard(product: ProductRow): ProductCardData {
    const pair = images[product.id]
    return { ...product, image: pair?.primary ?? null, secondaryImage: pair?.secondary ?? null }
  }

  const newInProducts = newArrivals.length > 0 ? newArrivals : latestProducts
  const newInTitle = newArrivals.length > 0 ? 'NEW IN' : 'LATEST PIECES'
  const heroImagePath = settingStr(settings, 'storefront.hero_image')
  const heroImage = heroImagePath ? mediaUrl(heroImagePath) : null

  return (
    <div className="bg-[var(--sf-bg)] text-[var(--sf-charcoal)]">
      <section className="relative isolate min-h-[100svh] overflow-hidden bg-black text-white">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImage} alt="" className="absolute inset-0 -z-20 size-full object-cover" />
        ) : null}
        <div className={`absolute inset-0 -z-10 ${heroImage ? 'bg-black/30' : 'bg-black'}`} />
        <div className="mx-auto flex min-h-[100svh] w-full max-w-5xl items-center px-5 sm:px-8">
          <h1 aria-label="DIR ድር THE FOUNDATION" className="flex w-full items-center justify-between gap-5 text-white sm:gap-8">
            <span className="sf-font-display whitespace-nowrap text-[clamp(1rem,4vw,4rem)] font-normal leading-none tracking-[-0.055em] drop-shadow-sm">
              DIR <span lang="am" className="ml-[0.18em] inline-block whitespace-nowrap text-[0.76em] tracking-[-0.04em]">(ድር)</span>
            </span>
            <span className="whitespace-nowrap text-right text-[clamp(0.65rem,1.65vw,1.55rem)] font-normal leading-none tracking-[0.1em] uppercase drop-shadow-sm">
              THE FOUNDATION
            </span>
          </h1>
        </div>
      </section>

      {categorySections.length > 0 && (
        <section className="sf-container sf-section">
          <div className="mb-8 flex items-end justify-between gap-6 sm:mb-10">
            <div>
              <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-neutral-500">Shop by collection</p>
              <h2 className="sf-font-display mt-2 text-3xl tracking-[-0.02em] sm:text-4xl">THE EDIT</h2>
            </div>
            <Link href="/products" className="hidden items-center gap-2 text-xs font-medium tracking-[0.12em] uppercase sm:flex">
              All pieces <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className={`grid gap-2 sm:gap-4 ${categorySections.length === 1 ? 'sm:grid-cols-1' : 'sm:grid-cols-2'}`}>
            {categorySections.map(({ category, products }) => {
              const categoryImage = images[products[0].id]?.primary
              return (
                <Link key={category.id} href={`/category/${category.slug}`} className="group relative aspect-[4/5] overflow-hidden bg-neutral-900 text-white">
                  {categoryImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={categoryImage} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]" />
                  ) : null}
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 sm:p-7">
                    <div>
                      <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-white/75">DIR collection</p>
                      <h3 className="sf-font-display mt-1 text-3xl tracking-[-0.02em] sm:text-4xl">{category.name}</h3>
                    </div>
                    <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {newInProducts.length > 0 && (
        <section className="sf-container sf-section pt-0">
          <SectionHeading eyebrow="Just arrived" title={newInTitle} href={newArrivals.length > 0 ? '/products?tags=NEW' : '/products'} />
          <div className="sf-product-grid">
            {newInProducts.slice(0, 8).map((product) => <ProductCard key={product.id} orgSlug={org.slug} product={toCard(product)} lang={lang} />)}
          </div>
        </section>
      )}

      <section className="border-y border-neutral-200 bg-white">
        <div className="sf-container grid gap-8 py-14 sm:grid-cols-[1fr_1.2fr] sm:items-end sm:py-20">
          <div>
            <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-neutral-500">DIR (ድር) THE FOUNDATION</p>
            <h2 className="sf-font-display mt-3 max-w-md text-4xl leading-none tracking-[-0.03em] sm:text-5xl">A FOUNDATION FOR WHAT&apos;S NEXT.</h2>
          </div>
          <div className="max-w-lg sm:justify-self-end">
            <p className="text-sm leading-6 text-neutral-600">Explore the current collection and find pieces that belong in your everyday rotation.</p>
            <Link href="/products" className="mt-6 inline-flex items-center gap-2 border-b border-black pb-1 text-xs font-medium tracking-[0.14em] uppercase hover:text-neutral-600">
              Discover DIR <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {categorySections.map(({ category, products }) => (
        <section key={category.id} className="sf-container sf-section">
          <SectionHeading eyebrow="The collection" title={category.name} href={`/category/${category.slug}`} />
          <div className="sf-product-grid">
            {products.map((product) => <ProductCard key={product.id} orgSlug={org.slug} product={toCard(product)} lang={lang} />)}
          </div>
        </section>
      ))}

      {saleProducts.length > 0 && (
        <section className="border-t border-neutral-200 bg-[#f9f7f5]">
          <div className="sf-container sf-section">
            <SectionHeading eyebrow="Available now" title="SALE" href="/products?tags=SALE" />
            <div className="sf-product-grid">
              {saleProducts.map((product) => <ProductCard key={product.id} orgSlug={org.slug} product={toCard(product)} lang={lang} />)}
            </div>
          </div>
        </section>
      )}

      {latestProducts.length === 0 && (
        <section className="sf-container py-24 text-center sm:py-32">
          <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-neutral-500">DIR (ድር) THE FOUNDATION</p>
          <h2 className="sf-font-display mt-3 text-3xl">THE COLLECTION IS COMING SOON</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-neutral-500">Please check back for available pieces.</p>
        </section>
      )}
    </div>
  )
}

function SectionHeading({ eyebrow, title, href }: { eyebrow: string; title: string; href: string }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-6 border-b border-neutral-200 pb-4 sm:mb-8">
      <div>
        <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-neutral-500">{eyebrow}</p>
        <h2 className="sf-font-display mt-2 text-3xl tracking-[-0.02em] sm:text-4xl">{title}</h2>
      </div>
      <Link href={href} className="inline-flex shrink-0 items-center gap-2 text-xs font-medium tracking-[0.12em] uppercase">
        View all <ArrowRight className="size-3.5" />
      </Link>
    </div>
  )
}
