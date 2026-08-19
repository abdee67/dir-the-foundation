'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { getServerClient } from '@/lib/supabase/server'
import { ORG_COOKIE, requireUser } from '@/lib/auth'

/** Validates the caller is a member of orgId, then sets it as the active org. */
export async function setActiveOrg(orgId: string): Promise<void> {
  const user = await requireUser()
  const supabase = await getServerClient()

  const { data: membership, error } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (error || !membership) {
    redirect('/onboarding')
  }

  const cookieStore = await cookies()
  cookieStore.set(ORG_COOKIE, orgId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })

  redirect('/admin')
}
