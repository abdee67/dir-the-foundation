'use server'

import { revalidatePath } from 'next/cache'

import { requireOrg } from '@/lib/auth'
import { getServerClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/lib/types'
import type { AppNotification } from '@/types/db'

/**
 * Latest 15 notifications visible to the caller (their own + org-wide
 * user_id=null rows), newest first. RLS-enforced client: the
 * notifications_select_staff_up policy already limits this to staff+
 * roles, so rider/viewer callers correctly get an empty list here.
 */
export async function listNotificationsAction(): Promise<ActionResult<AppNotification[]>> {
  const ctx = await requireOrg()

  try {
    const supabase = await getServerClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('org_id', ctx.org.id)
      .or(`user_id.eq.${ctx.user.id},user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(15)

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data ?? []) as AppNotification[] }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to load notifications' }
  }
}

/**
 * Marks every unread notification visible to the caller as read — their own
 * rows AND org-wide (user_id is null) rows. Uses the service-role client
 * deliberately: notifications_update_own's RLS `using (user_id = auth.uid())`
 * can never match a null-user_id row, so the org-wide half of this write is
 * impossible under RLS by design (same trap notify()'s INSERT works around).
 * The org_id scope below is applied in application code to keep the bypass
 * tight to exactly this org.
 */
export async function markAllReadAction(): Promise<ActionResult> {
  const ctx = await requireOrg()

  try {
    const supabase = getAdminClient()
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('org_id', ctx.org.id)
      .is('read_at', null)
      .or(`user_id.eq.${ctx.user.id},user_id.is.null`)

    if (error) return { ok: false, error: error.message }

    revalidatePath('/admin', 'layout')
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to mark notifications read',
    }
  }
}
