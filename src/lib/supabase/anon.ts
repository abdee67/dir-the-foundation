import { createClient } from '@supabase/supabase-js'

import { env } from '@/lib/env'

/**
 * Anon-key Supabase client with no cookie/session handling — for public
 * storefront reads (products, categories, cms_pages, reviews, listings).
 */
export function getAnonClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  })
}
