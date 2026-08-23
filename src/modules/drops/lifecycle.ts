import type { Drop, DropPhase } from '@/types/db'

/** Pure lifecycle helpers shared by the editor and trusted server processing. */
export function getScheduledPhase(
  drop: Pick<Drop, 'teaser_starts_at' | 'teaser_ends_at' | 'store_starts_at'>,
  now = new Date(),
): DropPhase | null {
  if (!drop.teaser_starts_at || !drop.teaser_ends_at || !drop.store_starts_at) return null
  const current = now.getTime()
  if (current < new Date(drop.teaser_starts_at).getTime()) return null
  if (current < new Date(drop.teaser_ends_at).getTime()) return 'teaser'
  if (current < new Date(drop.store_starts_at).getTime()) return 'reveal'
  return 'store'
}

export function revealReadiness(
  drop: Pick<Drop, 'reveal_product_id' | 'mens_campaign_media_id' | 'womens_campaign_media_id'>,
): string[] {
  const missing: string[] = []
  if (!drop.reveal_product_id) missing.push('a reveal product')
  if (!drop.mens_campaign_media_id) missing.push("the men's campaign image")
  if (!drop.womens_campaign_media_id) missing.push("the women's campaign image")
  return missing
}
