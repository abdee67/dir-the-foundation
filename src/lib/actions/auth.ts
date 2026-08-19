'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { audit } from '@/lib/audit'
import { ORG_COOKIE, requireUser, type OrgContext } from '@/lib/auth'
import { env } from '@/lib/env'
import { setActiveOrg } from '@/lib/actions/set-org'
import { getAdminClient } from '@/lib/supabase/admin'
import { getServerClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'
import type { Invitation, Org } from '@/types/db'

import {
  forgotSchema,
  loginSchema,
  signupSchema,
  type ForgotInput,
  type LoginInput,
  type SignupInput,
} from './auth-schemas'

/**
 * Only ever redirect to a same-origin relative path after auth — never an
 * absolute/external URL. Guards the ?next= round trip used by the invite flow.
 */
function safeNextPath(next: string | undefined): string | null {
  if (!next) return null
  if (!next.startsWith('/') || next.startsWith('//')) return null
  if (next.includes('://')) return null
  return next
}

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  let signInError: string | null = null
  try {
    const supabase = await getServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })
    signInError = error?.message ?? null
    if (!signInError && data.user) {
      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id, orgs!inner(is_active)')
        .eq('user_id', data.user.id)
        .eq('orgs.is_active', true)
        .limit(1)
        .maybeSingle()

      const orgId = (membership as { org_id: string } | null)?.org_id
      if (!orgId) {
        await supabase.auth.signOut()
        return { ok: false, error: 'This account is not assigned to an active store.' }
      }
      const cookieStore = await cookies()
      cookieStore.set(ORG_COOKIE, orgId, { httpOnly: true, sameSite: 'lax', path: '/' })
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Sign in failed.' }
  }

  if (signInError) {
    return { ok: false, error: signInError }
  }

  // redirect() throws — deliberately outside the try/catch above so it is
  // never accidentally swallowed as a "sign in failed" error.
  redirect(safeNextPath(parsed.data.next) ?? '/admin/dashboard')
}

export async function signupAction(
  input: SignupInput,
): Promise<ActionResult<{ needsEmailConfirmation: boolean }>> {
  const parsed = signupSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  let hasSession = false
  try {
    const supabase = await getServerClient()
    // emailRedirectTo intentionally omitted ("emailRedirect off") — no email
    // confirmation callback route exists in this slice; if confirmation is
    // required project-side, Supabase's default confirmation page is used.
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.full_name },
      },
    })
    if (error) return { ok: false, error: error.message }
    hasSession = Boolean(data.session)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Sign up failed.' }
  }

  if (!hasSession) {
    // Email confirmation is required project-side — no session yet.
    return { ok: true, data: { needsEmailConfirmation: true } }
  }

  redirect(safeNextPath(parsed.data.next) ?? '/onboarding')
}

export async function forgotAction(input: ForgotInput): Promise<ActionResult> {
  const parsed = forgotSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  try {
    const supabase = await getServerClient()
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${env.APP_URL}/reset-password`,
    })
    if (error) return { ok: false, error: error.message }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not send reset email.' }
  }

  return { ok: true }
}

export async function logoutAction(): Promise<void> {
  try {
    const supabase = await getServerClient()
    await supabase.auth.signOut()
  } catch (err) {
    console.error('[logoutAction] signOut failed', err)
  }

  const cookieStore = await cookies()
  cookieStore.delete(ORG_COOKIE)

  redirect('/admin/login')
}

export async function acceptInviteAction(token: string): Promise<ActionResult> {
  const user = await requireUser()

  // Invitations carry no anon/authenticated RLS policy for non-members by
  // design (supabase/migrations/0001_core.sql) — the admin client is the
  // documented way to read/accept by token.
  const admin = getAdminClient()

  const { data: invitationRow, error: inviteError } = await admin
    .from('invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (inviteError || !invitationRow) {
    return { ok: false, error: 'Invitation not found.' }
  }

  const invitation = invitationRow as Invitation
  const isExpired = new Date(invitation.expires_at).getTime() < Date.now()

  if (invitation.status !== 'pending' || isExpired) {
    return {
      ok: false,
      error: isExpired ? 'This invitation has expired.' : 'This invitation is no longer valid.',
    }
  }

  const { data: orgRow, error: orgError } = await admin
    .from('orgs')
    .select('*')
    .eq('id', invitation.org_id)
    .eq('is_active', true)
    .maybeSingle()

  if (orgError || !orgRow) {
    return { ok: false, error: 'Organization not found.' }
  }
  const org = orgRow as Org

  const { error: memberError } = await admin
    .from('org_members')
    .upsert({ org_id: org.id, user_id: user.id, role: invitation.role }, { onConflict: 'org_id,user_id' })

  if (memberError) {
    return { ok: false, error: memberError.message }
  }

  const { error: updateError } = await admin
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  const auditCtx: OrgContext = { user, org, role: invitation.role, settings: {} }
  audit(auditCtx, 'invitation.accepted', 'org_member', `${org.id}:${user.id}`, null, {
    role: invitation.role,
  })

  await setActiveOrg(org.id)
  return { ok: true }
}
