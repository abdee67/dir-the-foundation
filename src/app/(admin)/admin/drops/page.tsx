import Link from 'next/link'
import { ArrowUpRight, Plus, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { requireOrg } from '@/lib/auth'
import { requireModule } from '@/lib/modules'
import { getServerClient } from '@/lib/supabase/server'
import type { Drop, DropPhase } from '@/types/db'

export const dynamic = 'force-dynamic'

type DropListRow = Drop & { products: { name: string } | null }

function statusVariant(status: Drop['status']): 'success' | 'warning' | 'outline' {
  return status === 'active' ? 'success' : status === 'scheduled' ? 'warning' : 'outline'
}

function phaseLabel(phase: DropPhase) {
  return phase === 'store' ? 'Normal store' : phase === 'reveal' ? 'First reveal' : 'Teaser'
}

export default async function DropsPage() {
  const ctx = await requireOrg()
  requireModule(ctx.org, 'drops')
  const supabase = await getServerClient()
  const { data } = await supabase
    .from('drops')
    .select('*, products(name)')
    .eq('org_id', ctx.org.id)
    .order('updated_at', { ascending: false })
  const drops = (data ?? []) as unknown as DropListRow[]
  const active = drops.find((drop) => drop.status === 'active')
  const ids = drops.map((drop) => drop.id)
  const waitlistCounts = new Map<string, number>()
  if (ids.length > 0) {
    const { data: waitlistRows } = await supabase.from('drop_waitlist').select('drop_id').in('drop_id', ids)
    for (const row of waitlistRows ?? []) waitlistCounts.set(row.drop_id as string, (waitlistCounts.get(row.drop_id as string) ?? 0) + 1)
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeader eyebrow="Campaign control" title="Drop management" description="Plan campaigns, control the live phase, and prepare each release with confidence." actions={<Button asChild><Link href="/admin/drops/new"><Plus />New drop</Link></Button>} />

      <Card className="overflow-hidden border-foreground bg-foreground text-background">
        <CardContent className="grid gap-6 p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-8">
          <div><p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-background/60">Customers currently see</p><p className="mt-3 text-3xl font-semibold tracking-tight">{active ? phaseLabel(active.current_phase).toUpperCase() : 'NORMAL STORE'}</p><p className="mt-2 text-sm text-background/70">{active ? `${active.drop_number} · ${active.name}` : 'No active campaign is controlling the storefront.'}</p></div>
          {active ? <Button asChild variant="outline" className="border-background/30 bg-transparent text-background hover:bg-background hover:text-foreground"><Link href={`/admin/drops/${active.id}`}><Sparkles />Manage live drop</Link></Button> : <Button asChild variant="outline" className="border-background/30 bg-transparent text-background hover:bg-background hover:text-foreground"><Link href="/admin/drops/new"><Plus />Create a drop</Link></Button>}
        </CardContent>
      </Card>

      {drops.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center border border-dashed border-border bg-card px-5 text-center"><Sparkles className="size-6 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold">Your next campaign starts here.</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Create a drop to set its teaser, first reveal, lifecycle schedule, and waitlist.</p><Button asChild className="mt-5"><Link href="/admin/drops/new">Create first drop</Link></Button></div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="grid min-w-[760px] grid-cols-[9rem_minmax(13rem,1.5fr)_7rem_9rem_10rem_6rem_2.5rem] gap-4 border-b bg-muted/30 px-5 py-3 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase"><span>Drop</span><span>Campaign</span><span>Status</span><span>Live phase</span><span>Reveal</span><span>Waitlist</span><span /></div>
          <div className="overflow-x-auto">{drops.map((drop) => <Link key={drop.id} href={`/admin/drops/${drop.id}`} className="grid min-w-[760px] grid-cols-[9rem_minmax(13rem,1.5fr)_7rem_9rem_10rem_6rem_2.5rem] items-center gap-4 border-b px-5 py-4 last:border-b-0 transition-colors hover:bg-muted/40"><span className="text-xs font-semibold tracking-[0.12em]">{drop.drop_number}</span><span><span className="block font-medium text-foreground">{drop.name}</span><span className="mt-1 block text-xs text-muted-foreground">Updated {new Date(drop.updated_at).toLocaleDateString()}</span></span><Badge variant={statusVariant(drop.status)} className="capitalize">{drop.status}</Badge><span className="text-sm capitalize">{drop.status === 'active' ? drop.current_phase : '—'}</span><span className="truncate text-sm text-muted-foreground">{drop.products?.name ?? 'Not selected'}</span><span className="text-sm tabular-nums">{waitlistCounts.get(drop.id) ?? 0}</span><ArrowUpRight className="size-4 text-muted-foreground" /></Link>)}</div>
        </div>
      )}
    </div>
  )
}
