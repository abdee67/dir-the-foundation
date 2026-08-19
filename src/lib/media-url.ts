import { env } from '@/lib/env'

/**
 * Resolves a media storage path (e.g. `"{org_id}/1699999999-photo.jpg"`) to a
 * public URL served from the Supabase `media` storage bucket (public bucket,
 * see supabase/migrations/0001_core.sql). Paths that are already absolute
 * http(s) URLs (seed data, external images) pass through unchanged.
 *
 * Cross-slice contract — imported by catalog/listings/courses/storefront as
 * `import { mediaUrl } from '@/lib/media-url'`. Keep this signature stable.
 */
export function mediaUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const cleanPath = path.replace(/^\/+/, '')
  return `${env.SUPABASE_URL}/storage/v1/object/public/media/${cleanPath}`
}
