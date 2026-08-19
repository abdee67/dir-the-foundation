import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

import { env } from '@/lib/env'

let browserClient: SupabaseClient | undefined

/**
 * Browser Supabase client singleton. Used ONLY for auth forms + realtime
 * (see docs/conventions.md — Data access). Never query app tables from the
 * browser with the anon key in admin; server components/actions own that.
 */
export function getBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  }
  return browserClient
}
