import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/ui/page-header'
import { requireOrg } from '@/lib/auth'
import { requireModule } from '@/lib/modules'
import { getServerClient } from '@/lib/supabase/server'
import type { PageProps } from '@/lib/types'
import type { Drop, DropPhaseEvent, DropWaitlistEntry, Media, Product } from '@/types/db'
import { DropEditor } from '@/modules/drops/components/drop-editor'

export const dynamic = 'force-dynamic'

export default async function DropEditorPage({ params }: PageProps<{ id: string }>) {
  const { id } = await params
  const ctx = await requireOrg()
  requireModule(ctx.org, 'drops')
  const supabase = await getServerClient()
  const [dropResult, productsResult, eventsResult, waitlistResult] = await Promise.all([
    supabase.from('drops').select('*').eq('id', id).eq('org_id', ctx.org.id).single(),
    supabase.from('products').select('id, name, price, status').eq('org_id', ctx.org.id).order('name'),
    supabase.from('drop_phase_events').select('*').eq('drop_id', id).eq('org_id', ctx.org.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('drop_waitlist').select('*').eq('drop_id', id).order('created_at', { ascending: false }),
  ])
  if (!dropResult.data) notFound()
  const drop = dropResult.data as Drop
  const mediaIds = [drop.teaser_hero_media_id, drop.mens_campaign_media_id, drop.womens_campaign_media_id].filter((value): value is string => Boolean(value))
  const { data: mediaRows } = mediaIds.length > 0 ? await supabase.from('media').select('id, path').in('id', mediaIds) : { data: [] as Pick<Media, 'id' | 'path'>[] }
  const media = Object.fromEntries(((mediaRows ?? []) as Pick<Media, 'id' | 'path'>[]).map((item) => [item.id, item]))
  const entries = (waitlistResult.data ?? []) as DropWaitlistEntry[]
  const waitlist = {
    total: entries.length,
    waiting: entries.filter((entry) => entry.notification_status === 'waiting').length,
    sent: entries.filter((entry) => entry.notification_status === 'sent').length,
    failed: entries.filter((entry) => entry.notification_status === 'failed').length,
    entries,
  }
  return <div className="flex flex-col gap-6"><PageHeader eyebrow={`${drop.drop_number} · Campaign control`} title={drop.name} description="Configure the release, then deliberately control when customers move through it." backHref="/admin/drops" /><DropEditor mode="edit" drop={drop} products={(productsResult.data ?? []) as Pick<Product, 'id' | 'name' | 'price' | 'status'>[]} media={media} waitlist={waitlist} events={(eventsResult.data ?? []) as DropPhaseEvent[]} emailConfigured={Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL)} /></div>
}
