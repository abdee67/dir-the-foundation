import { getAnonClient } from '@/lib/supabase/anon'
import { mediaUrl } from '@/lib/media-url'

interface ProductImageJoinRow {
  product_id: string
  position: number
  media: { path: string } | { path: string }[] | null
}

/**
 * First (lowest-position) resolved image URL per product id — for grid cards (ProductCard,
 * productGrid block) that only need one thumbnail. Public read (product_images_public_select
 * RLS gates on the parent product's status = 'active', supabase/migrations/0002_commerce.sql).
 */
export async function getPrimaryImages(
  orgId: string,
  productIds: string[],
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {}
  if (productIds.length === 0) return result

  const supabase = getAnonClient()
  const { data, error } = await supabase
    .from('product_images')
    .select('product_id, position, media:media_id(path)')
    .eq('org_id', orgId)
    .in('product_id', productIds)
    .order('position', { ascending: true })

  if (error || !data) return result

  for (const row of data as unknown as ProductImageJoinRow[]) {
    if (row.product_id in result) continue // keep the first (lowest position) seen per product
    const media = Array.isArray(row.media) ? row.media[0] : row.media
    result[row.product_id] = media?.path ? mediaUrl(media.path) : null
  }

  for (const id of productIds) {
    if (!(id in result)) result[id] = null
  }

  return result
}
