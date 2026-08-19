// Central env accessor. Falls back to placeholder values so `next build` succeeds
// with no Supabase credentials configured (see docs/conventions.md — Data access).

const SUPABASE_URL_FALLBACK = 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY_FALLBACK = 'placeholder-anon-key'
const SUPABASE_SERVICE_ROLE_KEY_FALLBACK = 'placeholder-service-key'
const APP_URL_FALLBACK = 'http://localhost:3000'

export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_FALLBACK,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY_FALLBACK,
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY_FALLBACK,
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || APP_URL_FALLBACK,
  /** Slug of the single store org — required for the flat storefront routing. */
  STORE_SLUG: process.env.NEXT_PUBLIC_STORE_SLUG || '',
} as const

/** True only when real (non-placeholder) Supabase credentials are configured. */
export const isSupabaseConfigured: boolean = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== SUPABASE_URL_FALLBACK,
)
