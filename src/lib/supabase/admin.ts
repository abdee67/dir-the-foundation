import { createClient } from '@supabase/supabase-js'

import { env } from '@/lib/env'

// NOTE: the `server-only` package is not in package.json and conventions.md
// forbids adding new npm dependencies, so this inline guard substitutes for
// `import 'server-only'` — same effect (throws if ever pulled into a client
// bundle), zero new dependency.
if (typeof window !== 'undefined') {
  throw new Error(
    'src/lib/supabase/admin.ts (service-role client) must never be imported into client-side code.',
  )
}

/**
 * Service-role Supabase client — bypasses RLS. Server-only. Used for
 * storefront writes (order placement, inquiries) and any admin-client reads
 * documented in conventions.md (settings, notify, audit).
 */
export function getAdminClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}
