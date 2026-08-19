// Server-only guard: prevent accidental client imports.
if (typeof window !== 'undefined') {
  throw new Error('src/lib/store-org.ts must never be imported into client-side code.')
}

import { cache } from 'react'
import { notFound } from 'next/navigation'

import { getAnonClient } from '@/lib/supabase/anon'
import { env } from '@/lib/env'

/**
 * Public-safe org projection for the single-store storefront.
 * Shared public-safe organisation projection for all flat storefront routes.
 */
export interface StoreOrg {
  id: string
  name: string
  slug: string
  vertical: 'ecommerce' | 'courses' | 'services' | 'realestate'
  currency: string
  timezone: string
  logo_path: string | null
  phone: string | null
  email: string | null
  address: string | null
}

const STORE_ORG_COLUMNS =
  'id, name, slug, vertical, currency, timezone, logo_path, phone, email, address'

/**
 * Reads the single store's org using NEXT_PUBLIC_STORE_SLUG env var.
 * React cache()'d per request — every layout/page shares one query.
 * Calls notFound() if the org cannot be resolved (slug missing or inactive).
 */
export const getSingleStoreOrg = cache(async (): Promise<StoreOrg> => {
  const slug = env.STORE_SLUG
  if (!slug) {
    console.error('[store-org] NEXT_PUBLIC_STORE_SLUG is not set — cannot resolve storefront org.')
    notFound()
  }

  const supabase = getAnonClient()
  const { data, error } = await supabase
    .from('orgs')
    .select(STORE_ORG_COLUMNS)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) {
    console.error('[store-org] Could not resolve org for slug:', slug, error?.message)
    notFound()
  }

  return data as StoreOrg
})
