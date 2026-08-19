// Storefront link helpers — flat routing edition.
//
// The storefront now lives at the root: /, /products, /cart, /checkout, etc.
// The orgSlug parameter is kept in all function signatures for backward
// compatibility with shared storefront components. Callers still pass orgSlug,
// but the single-store route helpers deliberately ignore it.

/** Root-relative path for a flat-routing storefront link. Path defaults to '' (home). */
export function storePath(_orgSlug: string, path = ''): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  // Flat routing: /products, /cart, /checkout, etc.
  return clean === '/' ? '/' : clean
}

/**
 * Resolves an admin-authored menu href against the flat storefront.
 * Leaves absolute/external/anchor/protocol links untouched.
 */
export function resolveMenuHref(_orgSlug: string, href: string): string {
  if (!href) return '/'
  if (
    /^([a-z]+:)?\/\//i.test(href) ||
    href.startsWith('#') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:')
  ) {
    return href
  }
  // Strip legacy /s/{slug} prefix if present
  const legacyPrefix = /^\/s\/[^/]+/
  const stripped = legacyPrefix.test(href) ? href.replace(legacyPrefix, '') : href
  return stripped || '/'
}

/** wa.me link from `storefront.whatsapp_number` setting value. */
export function whatsappHref(number: string): string | null {
  const digits = number.replace(/[^\d]/g, '')
  return digits ? `https://wa.me/${digits}` : null
}
