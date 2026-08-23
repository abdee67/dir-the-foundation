import { getAdminClient } from '@/lib/supabase/admin'
import { notify } from '@/lib/notify'
import type { Drop, DropPhase } from '@/types/db'
import { sendDropLaunchNotifications } from './notifications'
import { getScheduledPhase, revealReadiness } from './lifecycle'

if (typeof window !== 'undefined') {
  throw new Error('src/modules/drops/service.ts must never be imported into client-side code.')
}

interface LifecycleResult {
  changed: boolean
  phase: DropPhase
  needsLaunchNotification: boolean
}

export async function assertRevealCanGoLive(drop: Pick<Drop, 'org_id' | 'reveal_product_id' | 'mens_campaign_media_id' | 'womens_campaign_media_id'>): Promise<void> {
  const missing = revealReadiness(drop)
  if (missing.length > 0) throw new Error(`Reveal cannot be activated until you add ${missing.join(', ')}.`)
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('products')
    .select('id, status')
    .eq('id', drop.reveal_product_id as string)
    .eq('org_id', drop.org_id)
    .maybeSingle()
  if (error || !data || data.status !== 'active') throw new Error('The reveal product must be an active product before launch.')
}

export async function transitionDropPhase({
  drop,
  toPhase,
  type,
  triggeredBy,
}: {
  drop: Drop
  toPhase: DropPhase
  type: 'automatic' | 'manual'
  triggeredBy: string | null
}): Promise<LifecycleResult> {
  if (drop.current_phase === toPhase) return { changed: false, phase: toPhase, needsLaunchNotification: false }
  if (toPhase === 'reveal') await assertRevealCanGoLive(drop)

  const supabase = getAdminClient()
  const { data: updated, error } = await supabase
    .from('drops')
    .update({
      current_phase: toPhase,
      manual_phase_override: type === 'manual' ? toPhase : null,
      updated_by: triggeredBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', drop.id)
    .eq('org_id', drop.org_id)
    .eq('current_phase', drop.current_phase)
    .select('id')
    .maybeSingle()
  if (error || !updated) {
    // Optimistic lock missed. This usually means a concurrent request (e.g. from the client's retry loop) already advanced it.
    const { data: current } = await supabase.from('drops').select('current_phase').eq('id', drop.id).maybeSingle()
    if (current && current.current_phase === toPhase) {
      return { changed: false, phase: toPhase, needsLaunchNotification: false }
    }
    throw new Error('The live phase changed elsewhere. Refresh and try again.')
  }

  const { error: eventError } = await supabase.from('drop_phase_events').insert({
    drop_id: drop.id,
    org_id: drop.org_id,
    from_phase: drop.current_phase,
    to_phase: toPhase,
    transition_type: type,
    triggered_by: triggeredBy,
  })
  if (eventError) console.error('[drops] phase event failed', eventError)

  await notify(drop.org_id, 'drop_phase_changed', {
    title: `${drop.drop_number} moved to ${toPhase.toUpperCase()}`,
    body: type === 'manual' ? 'The phase was manually changed by an administrator.' : 'The scheduled lifecycle moved to the next phase.',
    link: `/admin/drops/${drop.id}`,
  })

  return { changed: true, phase: toPhase, needsLaunchNotification: toPhase === 'reveal' && !drop.launch_notification_sent_at }
}

/** Called from a trusted cron route. Browser countdowns are never a lifecycle authority. */
export async function processAutomaticDropTransitions(): Promise<{ processed: number; changed: number }> {
  const supabase = getAdminClient()
  const { data, error } = await supabase.from('drops').select('*').in('status', ['active', 'scheduled']).eq('automatic_transitions_enabled', true).is('manual_phase_override', null)
  if (error) throw new Error('Could not load active drops.')

  let changed = 0
  let hasActiveDrop = (data ?? []).some((drop) => (drop as Drop).status === 'active')
  for (const rawDrop of (data ?? []) as Drop[]) {
    const phase = getScheduledPhase(rawDrop)
    if (!phase) continue
    if (rawDrop.status === 'scheduled') {
      if (hasActiveDrop) continue
      try {
        if (phase === 'reveal') await assertRevealCanGoLive(rawDrop)
      } catch (readinessError) {
        console.error(`[drops] ${rawDrop.drop_number} could not activate`, readinessError)
        continue
      }
      const { error: activateError } = await supabase.from('drops').update({ status: 'active', current_phase: phase, updated_at: new Date().toISOString() }).eq('id', rawDrop.id).eq('status', 'scheduled')
      if (activateError) {
        console.error('[drops] scheduled activation failed', activateError)
        continue
      }
      hasActiveDrop = true
      await supabase.from('drop_phase_events').insert({ drop_id: rawDrop.id, org_id: rawDrop.org_id, from_phase: null, to_phase: phase, transition_type: 'automatic', detail: { event: 'activated_from_schedule' } })
      if (phase === 'reveal' && !rawDrop.launch_notification_sent_at) {
        try { await sendDropLaunchNotifications({ ...rawDrop, status: 'active', current_phase: phase }) } catch (notificationError) { console.error('[drops] scheduled launch notification failed', notificationError) }
      }
      changed += 1
      continue
    }
    const result = await transitionDropPhase({ drop: rawDrop, toPhase: phase, type: 'automatic', triggeredBy: null })
    if (result.changed) changed += 1
    if (result.needsLaunchNotification) {
      try {
        await sendDropLaunchNotifications({ ...rawDrop, current_phase: phase })
      } catch (error) {
        // A phase transition must never be rolled back merely because the mail
        // provider is temporarily unavailable. The waitlist remains retryable.
        console.error('[drops] automatic launch notification failed', error)
      }
    }
  }
  return { processed: (data ?? []).length, changed }
}
