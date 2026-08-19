import { getAnonClient } from '@/lib/supabase/anon'
import { mediaUrl } from '@/lib/media-url'

interface ProductImageJoinRow {
  product_id: string
  position: number
  media: { path: string } | { path: string }[] | null
}

export interface ProductImagesPair {
  primary: string | null
  secondary: string | null
}

/**
 * Returns primary (first position) and secondary (second position) resolved image URLs
 * per product id for smooth hover crossfade.
 */
export async function getProductImages(
  orgId: string,
  productIds: string[],
): Promise<Record<string, ProductImagesPair>> {
  const result: Record<string, ProductImagesPair> = {}
  if (productIds.length === 0) return result

  for (const id of productIds) {
    result[id] = { primary: null, secondary: null }
  }

  const supabase = getAnonClient()
  const { data, error } = await supabase
    .from('product_images')
    .select('product_id, position, media:media_id(path)')
    .eq('org_id', orgId)
    .in('product_id', productIds)
    .order('position', { ascending: true })

  if (error || !data) return result

  const grouped: Record<string, string[]> = {}
  for (const row of data as unknown as ProductImageJoinRow[]) {
    const media = Array.isArray(row.media) ? row.media[0] : row.media
    if (media?.path) {
      if (!grouped[row.product_id]) grouped[row.product_id] = []
      grouped[row.product_id].push(mediaUrl(media.path))
    }
  }

  for (const id of productIds) {
    const list = grouped[id] || []
    result[id] = {
      primary: list[0] ?? null,
      secondary: list[1] ?? list[0] ?? null,
    }
  }

  return result
}
