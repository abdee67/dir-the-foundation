import { requireOrg, requireRole } from '@/lib/auth'
import { getServerClient } from '@/lib/supabase/server'
import type { PageProps } from '@/lib/types'

function csvCell(value: string | null): string {
  return `"${(value ?? '').replaceAll('"', '""')}"`
}

export async function GET(_request: Request, { params }: Pick<PageProps<{ id: string }>, 'params'>) {
  const { id } = await params
  const ctx = await requireOrg()
  requireRole(ctx, 'manager')
  const supabase = await getServerClient()
  const { data: drop } = await supabase.from('drops').select('drop_number').eq('id', id).eq('org_id', ctx.org.id).single()
  if (!drop) return new Response('Not found', { status: 404 })
  const { data } = await supabase
    .from('drop_waitlist')
    .select('phone_number, notification_status, provider_message_id, provider_campaign_id, notified_at, last_error, created_at')
    .eq('drop_id', id)
    .order('created_at', { ascending: false })
  const lines = ['phone_number,notification_status,provider_message_id,provider_campaign_id,notified_at,last_error,joined_at']
  for (const row of data ?? []) lines.push([row.phone_number, row.notification_status, row.provider_message_id, row.provider_campaign_id, row.notified_at, row.last_error, row.created_at].map((value) => csvCell(value as string | null)).join(','))
  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${String(drop.drop_number).replace(/[^A-Za-z0-9-_]/g, '-')}-waitlist.csv"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
