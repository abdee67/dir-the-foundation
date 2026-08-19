'use server'

import { revalidatePath } from 'next/cache'

import { requireOrg, requireRole } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { env } from '@/lib/env'
import { getServerClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'
import type { Invitation } from '@/types/db'
import {
  inviteMemberSchema,
  removeMemberSchema,
  revokeInviteSchema,
  updateMemberRoleSchema,
  type InviteMemberInput,
  type RemoveMemberInput,
  type RevokeInviteInput,
  type UpdateMemberRoleInput,
} from './schemas'

async function countOwners(orgId: string): Promise<number> {
  const supabase = await getServerClient()
  const { count } = await supabase
    .from('org_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('role', 'owner')
  return count ?? 0
}

/** Inserts a pending invitation and returns its shareable link. Email
 *  delivery is stubbed (console driver, matching lib/notify.ts's own email
 *  channel pattern) — invitations aren't a NotifyEvent, so this stays local
 *  rather than reaching into the shared notify() fan-out. */
export async function createInviteAction(
  input: InviteMemberInput,
): Promise<ActionResult<{ token: string; link: string }>> {
  const ctx = await requireOrg()
  requireRole(ctx, 'admin')

  const parsed = inviteMemberSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }
  const { email, role } = parsed.data

  if (role === 'owner' && ctx.role !== 'owner') {
    return { ok: false, error: 'Only the current owner can invite another owner.' }
  }

  try {
    const supabase = await getServerClient()

    const { data: existing } = await supabase
      .from('invitations')
      .select('id')
      .eq('org_id', ctx.org.id)
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) {
      return { ok: false, error: 'An invite is already pending for this email.' }
    }

    const { data: invite, error } = await supabase
      .from('invitations')
      .insert({ org_id: ctx.org.id, email, role, invited_by: ctx.user.id })
      .select()
      .single()

    if (error || !invite) {
      return { ok: false, error: error?.message ?? 'Failed to create invite' }
    }

    const row = invite as Invitation
    const link = `${env.APP_URL}/invite/${row.token}`

    console.log('[staff:invite:email]', { to: email, role, link })

    audit(ctx, 'staff.invited', 'invitations', row.id, undefined, { email, role })
    revalidatePath('/admin/staff')

    return { ok: true, data: { token: row.token, link } }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create invite' }
  }
}

export async function revokeInviteAction(input: RevokeInviteInput): Promise<ActionResult> {
  const ctx = await requireOrg()
  requireRole(ctx, 'admin')

  const parsed = revokeInviteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  try {
    const supabase = await getServerClient()
    const { data, error } = await supabase
      .from('invitations')
      .update({ status: 'revoked' })
      .eq('id', parsed.data.inviteId)
      .eq('org_id', ctx.org.id)
      .eq('status', 'pending')
      .select()
      .maybeSingle()

    if (error) return { ok: false, error: error.message }
    if (!data) return { ok: false, error: 'Invite not found or already resolved' }

    audit(ctx, 'staff.invite_revoked', 'invitations', parsed.data.inviteId, { status: 'pending' }, { status: 'revoked' })
    revalidatePath('/admin/staff')

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to revoke invite' }
  }
}

/** Owner-role changes are double-guarded: assigning OR removing the owner
 *  role both require the caller to already be an owner, and the org's last
 *  remaining owner can never be demoted (mirrors the removeMember guard). */
export async function updateMemberRoleAction(input: UpdateMemberRoleInput): Promise<ActionResult> {
  const ctx = await requireOrg()
  requireRole(ctx, 'admin')

  const parsed = updateMemberRoleSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }
  const { userId, role } = parsed.data

  try {
    const supabase = await getServerClient()
    const { data: member, error: fetchError } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', ctx.org.id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !member) return { ok: false, error: 'Member not found' }
    const before = member.role as string

    const touchesOwner = role === 'owner' || before === 'owner'
    if (touchesOwner && ctx.role !== 'owner') {
      return { ok: false, error: 'Only the current owner can assign or change the owner role.' }
    }

    if (before === 'owner' && role !== 'owner') {
      const owners = await countOwners(ctx.org.id)
      if (owners <= 1) {
        return { ok: false, error: 'Cannot change role: this is the only owner.' }
      }
    }

    const { error } = await supabase
      .from('org_members')
      .update({ role })
      .eq('org_id', ctx.org.id)
      .eq('user_id', userId)

    if (error) return { ok: false, error: error.message }

    audit(ctx, 'staff.role_updated', 'org_members', userId, { role: before }, { role })
    revalidatePath('/admin/staff')

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update role' }
  }
}

export async function removeMemberAction(input: RemoveMemberInput): Promise<ActionResult> {
  const ctx = await requireOrg()
  requireRole(ctx, 'admin')

  const parsed = removeMemberSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }
  const { userId } = parsed.data

  try {
    const supabase = await getServerClient()
    const { data: member, error: fetchError } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', ctx.org.id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !member) return { ok: false, error: 'Member not found' }
    const before = member.role as string

    if (before === 'owner') {
      if (ctx.role !== 'owner') {
        return { ok: false, error: 'Only the current owner can remove an owner.' }
      }
      const owners = await countOwners(ctx.org.id)
      if (owners <= 1) {
        return { ok: false, error: 'Cannot remove the last owner.' }
      }
    }

    const { error } = await supabase
      .from('org_members')
      .delete()
      .eq('org_id', ctx.org.id)
      .eq('user_id', userId)

    if (error) return { ok: false, error: error.message }

    audit(ctx, 'staff.removed', 'org_members', userId, { role: before }, undefined)
    revalidatePath('/admin/staff')

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to remove member' }
  }
}
