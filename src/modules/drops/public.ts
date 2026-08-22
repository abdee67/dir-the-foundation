import { cache } from 'react'

import { mediaUrl } from '@/lib/media-url'
import { getAdminClient } from '@/lib/supabase/admin'

if (typeof window !== 'undefined') {
  throw new Error('src/modules/drops/public.ts must never be imported into client-side code.')
}

export interface PublicTeaserDrop {
  id: string
  endsAt: string
  heroImage: { src: string; alt: string }
}

export interface PublicRevealVariant {
  id: string
  name: string
  price: number
  compareAtPrice: number | null
  stockQty: number
  options: Record<string, string>
  isDefault: boolean
}

export interface PublicRevealDrop {
  id: string
  number: string
  name: string
  product: {
    id: string
    name: string
    price: number
    compareAtPrice: number | null
    color: string | null
    trackStock: boolean
    allowBackorder: boolean
    stockQty: number
    image: string | null
    variants: PublicRevealVariant[]
  }
  mensImage: { src: string; alt: string }
  womensImage: { src: string; alt: string }
}

export type PublicDropResolution =
  | { state: 'teaser'; drop: PublicTeaserDrop }
  | { state: 'reveal'; drop: PublicRevealDrop }
  | { state: 'none' }
  | { state: 'unavailable' }

async function mediaById(orgId: string, ids: string[]) {
  const supabase = getAdminClient()
  const { data, error } = await supabase.from('media').select('id, path, alt').eq('org_id', orgId).in('id', ids)
  if (error) return null
  return new Map((data ?? []).map((media) => [media.id, { src: mediaUrl(media.path), alt: media.alt?.trim() || 'DIR drop campaign' }]))
}

/** Server-authoritative, public-safe active-drop projection. */
export const resolvePublicDrop = cache(async (orgId: string): Promise<PublicDropResolution> => {
  try {
    const supabase = getAdminClient()
    const { data: drop, error: dropError } = await supabase
      .from('drops')
      .select('id, drop_number, name, current_phase, teaser_hero_media_id, teaser_ends_at, reveal_product_id, mens_campaign_media_id, womens_campaign_media_id')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .maybeSingle()
    if (dropError) {
      console.error('[drops:public] could not resolve the active drop', dropError)
      return { state: 'unavailable' }
    }
    if (!drop) return { state: 'none' }

    if (drop.current_phase === 'teaser') {
      if (!drop.teaser_hero_media_id || !drop.teaser_ends_at) return { state: 'unavailable' }
      const media = await mediaById(orgId, [drop.teaser_hero_media_id])
      const heroImage = media?.get(drop.teaser_hero_media_id)
      return heroImage ? { state: 'teaser', drop: { id: drop.id, endsAt: drop.teaser_ends_at, heroImage } } : { state: 'unavailable' }
    }

    if (drop.current_phase !== 'reveal') return { state: 'none' }
    if (!drop.reveal_product_id || !drop.mens_campaign_media_id || !drop.womens_campaign_media_id) return { state: 'unavailable' }

    const [{ data: product, error: productError }, media] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, price, compare_at_price, color, track_stock, allow_backorder, stock_qty')
        .eq('id', drop.reveal_product_id)
        .eq('org_id', orgId)
        .eq('status', 'active')
        .maybeSingle(),
      mediaById(orgId, [drop.mens_campaign_media_id, drop.womens_campaign_media_id]),
    ])
    const mensImage = media?.get(drop.mens_campaign_media_id)
    const womensImage = media?.get(drop.womens_campaign_media_id)
    if (productError || !product || !mensImage || !womensImage) return { state: 'unavailable' }

    const [{ data: variants }, { data: productImages }] = await Promise.all([
      supabase.from('product_variants').select('id, name, price, compare_at_price, stock_qty, options, is_default').eq('org_id', orgId).eq('product_id', product.id).order('position'),
      supabase.from('product_images').select('position, media:media_id(path)').eq('org_id', orgId).eq('product_id', product.id).order('position').limit(1),
    ])
    const imageJoin = (productImages?.[0] as unknown as { media: { path: string } | { path: string }[] | null } | undefined)?.media
    const primaryMedia = Array.isArray(imageJoin) ? imageJoin[0] : imageJoin
    return {
      state: 'reveal',
      drop: {
        id: drop.id,
        number: drop.drop_number,
        name: drop.name,
        mensImage,
        womensImage,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          compareAtPrice: product.compare_at_price,
          color: product.color,
          trackStock: product.track_stock,
          allowBackorder: product.allow_backorder,
          stockQty: product.stock_qty,
          image: primaryMedia?.path ? mediaUrl(primaryMedia.path) : null,
          variants: (variants ?? []).map((variant) => ({
            id: variant.id,
            name: variant.name,
            price: variant.price,
            compareAtPrice: variant.compare_at_price,
            stockQty: variant.stock_qty,
            options: Object.fromEntries(Object.entries((variant.options ?? {}) as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === 'string')),
            isDefault: variant.is_default,
          })),
        },
      },
    }
  } catch (error) {
    console.error('[drops:public] unexpected active drop lookup failure', error)
    return { state: 'unavailable' }
  }
})
