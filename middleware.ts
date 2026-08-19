import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { env } from '@/lib/env'

// Kept as a literal (not imported from '@/lib/auth') to keep middleware's
// dependency graph minimal — it runs on every request. Keep in sync with
// ORG_COOKIE in src/lib/auth.ts.
const ORG_COOKIE = 'scarpar-org'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  // Refresh the session so server components downstream see a valid cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAdminPath = pathname.startsWith('/admin')
  const isAdminLoginPath = pathname === '/admin/login'

  // Admin paths require authentication — redirect to /login if no user.
  if (isAdminPath && !isAdminLoginPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // Admin paths require an org cookie — redirect to /login if missing so the
  // login page can set it up. The onboarding wizard is removed for single-org
  // operation; org setup is done via direct DB seeding / admin setup.
  if (isAdminPath && !isAdminLoginPath && user) {
    const hasOrgCookie = Boolean(request.cookies.get(ORG_COOKIE)?.value)
    if (!hasOrgCookie) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|txt|xml)$).*)',
  ],
}
