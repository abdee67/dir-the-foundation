import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

import { getServerClient } from '@/lib/supabase/server'
import { getOrgSettings } from '@/lib/settings'
import type { Org, Role } from '@/types/db'

/** Cookie holding the active org id (docs/architecture.md §6). */
export const ORG_COOKIE = 'scarpar-org'

export const ROLE_RANK: Record<Role, number> = {
  owner: 5,
  admin: 4,
  manager: 3,
  staff: 2,
  viewer: 1,
}

export interface OrgContext {
  user: User
  org: Org
  role: Role
  settings: Record<string, unknown>
}

/** Current Supabase auth user, or null. React cache()'d per request. */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await getServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

/** Redirects to the isolated admin login if there's no signed-in user. */
export async function requireUser(): Promise<User> {
  const user = await getUser()
  if (!user) {
    redirect('/admin/login')
  }
  return user
}

/**
 * Reads the scarpar-org cookie, loads the org + the caller's membership role
 * + org settings (parallel query set), and returns the full OrgContext.
 * Redirects to the admin login if the cookie is missing or points at an org
 * the user isn't (or is no longer) a member of. Single-store setup is done
 * by the seed/admin setup instructions, not public onboarding.
 */
export const requireOrg = cache(async (): Promise<OrgContext> => {
  const user = await requireUser()

  const cookieStore = await cookies()
  const orgId = cookieStore.get(ORG_COOKIE)?.value

  if (!orgId) {
    redirect('/admin/login')
  }

  const supabase = await getServerClient()

  const [orgResult, memberResult, settings] = await Promise.all([
    supabase.from('orgs').select('*').eq('id', orgId).eq('is_active', true).single(),
    supabase.from('org_members').select('role').eq('org_id', orgId).eq('user_id', user.id).single(),
    getOrgSettings(orgId),
  ])

  if (orgResult.error || !orgResult.data || memberResult.error || !memberResult.data) {
    redirect('/admin/login')
  }

  return {
    user,
    org: orgResult.data as Org,
    role: (memberResult.data as { role: Role }).role,
    settings,
  }
})

/** Redirects to /admin if ctx.role is below minRole in the owner>admin>manager>staff>rider>viewer order. */
export function requireRole(ctx: OrgContext, minRole: Role): void {
  if (ROLE_RANK[ctx.role] < ROLE_RANK[minRole]) {
    redirect('/admin')
  }
}
