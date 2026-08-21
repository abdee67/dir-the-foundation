'use server'

import { revalidatePath } from 'next/cache'

import { audit } from '@/lib/audit'
import { requireOrg, requireRole } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase/admin'
import type { Drop } from '@/types/db'
import type { ActionResult } from '@/lib/types'

import { sendDropLaunchNotifications } from './notifications'
import { getScheduledPhase } from './lifecycle'
import { transitionDropPhase } from './service'
import { dropInputSchema, dropPhaseSchema, type DropInput, type DropPhaseInput } from './schemas'

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? 'Check the drop details and try again.'
}

function friendlyError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : fallback
  if (/unique|drops_one_active/i.test(message)) return 'Another drop is already active. Review it before activating this drop.'
  return message
}

function changedPaths(id: string) {
  revalidatePath('/admin/drops')
  revalidatePath(`/admin/drops/${id}`)
}

/** Every referenced product/media record must belong to the active org. */
async function validateReferences(orgId: string, input: DropInput): Promise<string | null> {
  const supabase = getAdminClient()
  const mediaIds = [input.teaser_hero_media_id, input.mens_campaign_media_id, input.womens_campaign_media_id].filter((id): id is string => Boolean(id))
  if (mediaIds.length > 0) {
    const { data, error } = await supabase.from('media').select('id').eq('org_id', orgId).in('id', mediaIds)
    if (error || (data ?? []).length !== new Set(mediaIds).size) return 'One or more selected campaign images are unavailable.'
  }
  if (input.reveal_product_id) {
    const { data, error } = await supabase.from('products').select('id').eq('org_id', orgId).eq('id', input.reveal_product_id).maybeSingle()
    if (error || !data) return 'The selected reveal product is unavailable.'
  }
  return null
}

export async function createDropAction(input: DropInput): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireOrg()
  requireRole(ctx, 'manager')
  const parsed = dropInputSchema.safeParse({ ...input, status: 'draft' })
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }

  const data = parsed.data
  const referenceError = await validateReferences(ctx.org.id, data)
  if (referenceError) return { ok: false, error: referenceError }
  const supabase = getAdminClient()
  const { data: row, error } = await supabase
    .from('drops')
    .insert({ ...data, org_id: ctx.org.id, drop_number: data.drop_number.toUpperCase(), created_by: ctx.user.id, updated_by: ctx.user.id })
    .select('id')
    .single()
  if (error || !row) return { ok: false, error: error?.code === '23505' ? 'That drop number is already in use.' : 'Unable to create this drop.' }

  audit(ctx, 'drop:create', 'drop', row.id as string, undefined, data)
  changedPaths(row.id as string)
  return { ok: true, data: { id: row.id as string } }
}

export async function updateDropAction(id: string, input: DropInput): Promise<ActionResult> {
  const ctx = await requireOrg()
  requireRole(ctx, 'manager')
  const parsed = dropInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }
  const data = parsed.data
  const referenceError = await validateReferences(ctx.org.id, data)
  if (referenceError) return { ok: false, error: referenceError }
  const supabase = getAdminClient()
  const { data: existing, error: lookupError } = await supabase.from('drops').select('*').eq('id', id).eq('org_id', ctx.org.id).single()
  if (lookupError || !existing) return { ok: false, error: 'Drop not found.' }
  const { error } = await supabase
    .from('drops')
    .update({ ...data, status: existing.status === 'active' ? 'active' : data.status, drop_number: data.drop_number.toUpperCase(), updated_by: ctx.user.id, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('org_id', ctx.org.id)
  if (error) return { ok: false, error: error.code === '23505' ? 'That drop number is already in use.' : 'Unable to save this drop.' }

  audit(ctx, 'drop:update', 'drop', id, existing, data)
  changedPaths(id)
  return { ok: true }
}

export async function activateDropAction(id: string): Promise<ActionResult<{ replacedDropName?: string; scheduled?: boolean }>> {
  const ctx = await requireOrg()
  requireRole(ctx, 'admin')
  const supabase = getAdminClient()
  const { data: dropRaw, error: lookupError } = await supabase.from('drops').select('*').eq('id', id).eq('org_id', ctx.org.id).single()
  const drop = dropRaw as Drop | null
  if (lookupError || !drop) return { ok: false, error: 'Drop not found.' }
  if (drop.status === 'archived' || drop.status === 'completed') return { ok: false, error: 'Archived or completed drops cannot be activated.' }
  if (!drop.teaser_hero_media_id || !drop.teaser_starts_at || !drop.teaser_ends_at || !drop.store_starts_at) {
    return { ok: false, error: 'Add the teaser image and all lifecycle dates before activation.' }
  }

  const { data: activation, error: activationError } = await supabase.rpc('activate_drop', { p_drop_id: id, p_actor_id: ctx.user.id }).single()
  if (activationError || !activation) return { ok: false, error: friendlyError(activationError, 'Unable to activate this drop.') }
  const result = activation as { replaced_drop_id: string | null; is_scheduled: boolean }
  let replacedDropName: string | undefined
  if (result.replaced_drop_id) {
    const { data: replaced } = await supabase.from('drops').select('name').eq('id', result.replaced_drop_id).maybeSingle()
    replacedDropName = (replaced as { name: string } | null)?.name
  }
  audit(ctx, result.is_scheduled ? 'drop:scheduled' : 'drop:activate', 'drop', id, { status: drop.status }, { status: result.is_scheduled ? 'scheduled' : 'active', replaced_drop_id: result.replaced_drop_id })
  changedPaths(id)
  return { ok: true, data: { replacedDropName, scheduled: result.is_scheduled } }
}

export async function setDropPhaseAction(id: string, input: DropPhaseInput): Promise<ActionResult> {
  const ctx = await requireOrg()
  requireRole(ctx, 'admin')
  const parsed = dropPhaseSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }
  const supabase = getAdminClient()
  const { data, error } = await supabase.from('drops').select('*').eq('id', id).eq('org_id', ctx.org.id).single()
  const drop = data as Drop | null
  if (error || !drop) return { ok: false, error: 'Drop not found.' }
  if (drop.status !== 'active') return { ok: false, error: 'Activate this drop before changing its public phase.' }

  try {
    const result = await transitionDropPhase({ drop, toPhase: parsed.data.phase, type: 'manual', triggeredBy: ctx.user.id })
    if (result.needsLaunchNotification) {
      try {
        await sendDropLaunchNotifications({ ...drop, current_phase: result.phase })
      } catch (notificationError) {
        console.error('[drops] manual launch notification failed', notificationError)
      }
    }
    audit(ctx, 'drop:phase_manual', 'drop', id, { phase: drop.current_phase }, { phase: parsed.data.phase })
    changedPaths(id)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: friendlyError(err, 'Unable to change the live phase.') }
  }
}

export async function resumeDropAutomationAction(id: string): Promise<ActionResult> {
  const ctx = await requireOrg()
  requireRole(ctx, 'admin')
  const supabase = getAdminClient()
  const { data, error } = await supabase.from('drops').select('*').eq('id', id).eq('org_id', ctx.org.id).single()
  const drop = data as Drop | null
  if (error || !drop) return { ok: false, error: 'Drop not found.' }
  if (drop.status !== 'active') return { ok: false, error: 'Only the active drop can resume automatic transitions.' }
  if (!drop.automatic_transitions_enabled) return { ok: false, error: 'Enable automatic transitions in the lifecycle settings first.' }

  const { error: overrideError } = await supabase.from('drops').update({ manual_phase_override: null, updated_by: ctx.user.id, updated_at: new Date().toISOString() }).eq('id', id)
  if (overrideError) return { ok: false, error: 'Unable to resume automation.' }
  const scheduled = getScheduledPhase(drop)
  try {
    if (scheduled) await transitionDropPhase({ drop: { ...drop, manual_phase_override: null }, toPhase: scheduled, type: 'automatic', triggeredBy: ctx.user.id })
    audit(ctx, 'drop:automation_resumed', 'drop', id, { manual_phase_override: drop.manual_phase_override }, { scheduled_phase: scheduled })
    changedPaths(id)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: friendlyError(err, 'Unable to resume automation.') }
  }
}

export async function sendDropLaunchNotificationAction(id: string, retryFailed = false): Promise<ActionResult<{ sent: number; failed: number }>> {
  const ctx = await requireOrg()
  requireRole(ctx, 'admin')
  const supabase = getAdminClient()
  const { data, error } = await supabase.from('drops').select('*').eq('id', id).eq('org_id', ctx.org.id).single()
  const drop = data as Drop | null
  if (error || !drop) return { ok: false, error: 'Drop not found.' }
  if (drop.current_phase === 'teaser') return { ok: false, error: 'Launch notifications can only be sent once the drop reaches reveal.' }
  try {
    const result = await sendDropLaunchNotifications(drop, retryFailed)
    audit(ctx, retryFailed ? 'drop:notification_retry' : 'drop:notification_send', 'drop', id, undefined, result)
    changedPaths(id)
    return { ok: true, data: result }
  } catch (err) {
    return { ok: false, error: friendlyError(err, 'Unable to send launch notifications.') }
  }
}
