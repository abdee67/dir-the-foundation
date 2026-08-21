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

export type PublicDropResolution =
  | { state: 'teaser'; drop: PublicTeaserDrop }
  | { state: 'none' }
  | { state: 'unavailable' }

/**
 * The storefront deliberately resolves the phase on the server. The browser
 * may animate a countdown, but it never decides when the public experience
 * changes. Service-role access is used only for this minimal, public-safe
 * projection because the drops table itself has no anonymous read policy.
 */
export const resolvePublicDrop = cache(async (orgId: string): Promise<PublicDropResolution> => {
  try {
    const supabase = getAdminClient()
    const { data: drop, error: dropError } = await supabase
      .from('drops')
      .select('id, teaser_hero_media_id, teaser_ends_at')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .eq('current_phase', 'teaser')
      .maybeSingle()

    if (dropError) {
      console.error('[drops:public] could not resolve the active drop', dropError)
      return { state: 'unavailable' }
    }
    if (!drop) return { state: 'none' }

    // A live teaser is only valid with both fields. Do not leak an incomplete
    // admin record or fall through to a catalog that should be temporarily hidden.
    if (!drop.teaser_hero_media_id || !drop.teaser_ends_at) {
      console.error('[drops:public] active teaser is incomplete', { dropId: drop.id })
      return { state: 'unavailable' }
    }

    const { data: media, error: mediaError } = await supabase
      .from('media')
      .select('path, alt')
      .eq('id', drop.teaser_hero_media_id)
      .eq('org_id', orgId)
      .maybeSingle()

    if (mediaError || !media?.path) {
      console.error('[drops:public] could not resolve teaser media', mediaError ?? { dropId: drop.id })
      return { state: 'unavailable' }
    }

    return {
      state: 'teaser',
      drop: {
        id: drop.id,
        endsAt: drop.teaser_ends_at,
        heroImage: { src: mediaUrl(media.path), alt: media.alt?.trim() || 'DIR drop campaign' },
      },
    }
  } catch (error) {
    console.error('[drops:public] unexpected active drop lookup failure', error)
    return { state: 'unavailable' }
  }
})
