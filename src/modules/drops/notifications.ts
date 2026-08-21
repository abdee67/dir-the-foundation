import { getAdminClient } from '@/lib/supabase/admin'
import type { Drop } from '@/types/db'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL)
}

export async function sendDropLaunchNotifications(drop: Drop, retryFailed = false): Promise<{ sent: number; failed: number }> {
  if (!emailConfigured()) throw new Error('Email delivery is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL on the server before sending.')

  const supabase = getAdminClient()
  let query = supabase.from('drop_waitlist').select('id, email').eq('drop_id', drop.id)
  query = retryFailed ? query.eq('notification_status', 'failed') : query.eq('notification_status', 'waiting')
  const { data, error } = await query
  if (error) throw new Error('Unable to load waitlist subscribers.')

  let sent = 0
  let failed = 0
  for (const recipient of data ?? []) {
    const { data: lockedRow, error: lockError } = await supabase
      .from('drop_waitlist')
      .update({ notification_status: 'sending', notification_error: null })
      .eq('id', recipient.id)
      .in('notification_status', retryFailed ? ['failed'] : ['waiting'])
      .select('id')
      .maybeSingle()
    if (lockError || !lockedRow) continue

    try {
      const response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL,
          to: [recipient.email],
          subject: `${drop.drop_number} — ${drop.name} is now live`,
          html: `<p>${drop.name} is now available.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/products">Discover the collection</a></p>`,
        }),
      })
      if (!response.ok) throw new Error(`Provider returned ${response.status}`)
      await supabase.from('drop_waitlist').update({ notification_status: 'sent', notified_at: new Date().toISOString(), notification_error: null }).eq('id', recipient.id)
      sent += 1
    } catch (error) {
      await supabase.from('drop_waitlist').update({ notification_status: 'failed', notification_error: error instanceof Error ? error.message.slice(0, 500) : 'Delivery failed' }).eq('id', recipient.id)
      failed += 1
    }
  }

  if (!retryFailed && sent > 0) await supabase.from('drops').update({ launch_notification_sent_at: new Date().toISOString() }).eq('id', drop.id)
  await supabase.from('drop_phase_events').insert({ drop_id: drop.id, org_id: drop.org_id, from_phase: null, to_phase: 'reveal', transition_type: 'notification', detail: { sent, failed, retry_failed: retryFailed } })
  return { sent, failed }
}
