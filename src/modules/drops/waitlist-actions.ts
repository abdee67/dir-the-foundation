'use server'

import { z } from 'zod'

import { getAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/lib/types'
import { normalizeEthiopianPhone } from './phone'

const waitlistInputSchema = z.object({
  dropId: z.string().uuid(),
  phoneNumber: z.string().trim().min(1, 'Please enter a valid phone number.').max(40),
})

/**
 * The waitlist table has no anonymous read/write policy. This server action
 * exposes exactly one safe public operation: subscribe one validated address
 * to the currently active teaser, never returning row data or database errors.
 */
export async function joinDropWaitlistAction(dropId: string, phoneNumber: string): Promise<ActionResult> {
  const parsed = waitlistInputSchema.safeParse({ dropId, phoneNumber })
  const normalizedPhone = parsed.success ? normalizeEthiopianPhone(parsed.data.phoneNumber) : null
  if (!parsed.success || !normalizedPhone) return { ok: false, error: 'Please enter a valid phone number.' }

  try {
    const supabase = getAdminClient()
    // The database checks the active phase and inserts in one transaction, so
    // an administrator cannot switch the drop between a separate read/write.
    const { data: outcome, error } = await supabase.rpc('subscribe_to_active_drop_waitlist', {
      p_drop_id: parsed.data.dropId,
      p_phone_number: normalizedPhone,
    })

    if (!error && outcome === 'joined') return { ok: true }
    if (!error && outcome === 'duplicate') return { ok: false, error: "You're already on the list for this drop." }
    if (error) console.error('[drops:waitlist] subscription failed', error)
    return { ok: false, error: "We couldn't add you right now. Please try again." }
  } catch (error) {
    console.error('[drops:waitlist] unexpected subscription failure', error)
    return { ok: false, error: "We couldn't add you right now. Please try again." }
  }
}
