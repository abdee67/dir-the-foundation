import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { env } from '@/lib/env'

/**
 * Cookie-session Supabase client for server components, route handlers and
 * server actions. RLS-enforced (anon key + user's session cookies).
 * Next 15: cookies() is async, so this factory is async too.
 */
export async function getServerClient() {
  const cookieStore = await cookies()

  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from a Server Component render (no response to write cookies
          // to) — middleware.ts refreshes the session on the next navigation.
        }
      },
    },
  })
}
