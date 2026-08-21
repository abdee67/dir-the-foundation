'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Clock3, ExternalLink, Loader2, Mail, Play, Save, Send, Sparkles, Zap } from 'lucide-react'
import { toast } from 'sonner'

import { MediaPicker, type MediaPickerValue } from '@/components/admin/media-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { Drop, DropPhase, DropPhaseEvent, DropWaitlistEntry, Product } from '@/types/db'

import {
  activateDropAction,
  createDropAction,
  resumeDropAutomationAction,
  sendDropLaunchNotificationAction,
  setDropPhaseAction,
  updateDropAction,
} from '../actions'
import type { DropInput } from '../schemas'
import { getScheduledPhase, revealReadiness } from '../lifecycle'

type ProductOption = Pick<Product, 'id' | 'name' | 'price' | 'status'>

interface DropEditorProps {
  mode: 'create' | 'edit'
  drop?: Drop
  products: ProductOption[]
  media: Record<string, MediaPickerValue>
  waitlist?: { total: number; waiting: number; sent: number; failed: number; entries: DropWaitlistEntry[] }
  events?: DropPhaseEvent[]
  emailConfigured?: boolean
}

type EditorState = Omit<DropInput, 'teaser_starts_at' | 'teaser_ends_at' | 'store_starts_at'> & {
  teaser_starts_at: string
  teaser_ends_at: string
  store_starts_at: string
}

const fieldClass = 'bg-background'

function localDate(iso: string | null | undefined): string {
  return iso ? new Date(iso).toISOString().slice(0, 16) : ''
}

function iso(value: string): string | null {
  return value ? new Date(value).toISOString() : null
}

function initialState(drop?: Drop): EditorState {
  return {
    drop_number: drop?.drop_number ?? 'DROP 001',
    name: drop?.name ?? '',
    description: drop?.description ?? '',
    status: drop && drop.status !== 'active' ? drop.status : 'draft',
    teaser_hero_media_id: drop?.teaser_hero_media_id ?? null,
    teaser_starts_at: localDate(drop?.teaser_starts_at),
    teaser_ends_at: localDate(drop?.teaser_ends_at),
    reveal_product_id: drop?.reveal_product_id ?? null,
    mens_campaign_media_id: drop?.mens_campaign_media_id ?? null,
    womens_campaign_media_id: drop?.womens_campaign_media_id ?? null,
    store_starts_at: localDate(drop?.store_starts_at),
    automatic_transitions_enabled: drop?.automatic_transitions_enabled ?? true,
  }
}

function readiness(state: EditorState): { label: string; complete: boolean }[] {
  return [
    { label: 'Drop identity', complete: Boolean(state.drop_number.trim() && state.name.trim()) },
    { label: 'Teaser hero image', complete: Boolean(state.teaser_hero_media_id) },
    { label: 'Teaser schedule', complete: Boolean(state.teaser_starts_at && state.teaser_ends_at && state.store_starts_at) },
    { label: 'Reveal product', complete: Boolean(state.reveal_product_id) },
    { label: "Men's campaign image", complete: Boolean(state.mens_campaign_media_id) },
    { label: "Women's campaign image", complete: Boolean(state.womens_campaign_media_id) },
  ]
}

function PhaseStep({ phase, active }: { phase: DropPhase; active: boolean }) {
  return <span className={`inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase ${active ? 'text-foreground' : 'text-muted-foreground'}`}><span className={`size-2 rounded-full ${active ? 'bg-foreground' : 'bg-border'}`} />{phase}</span>
}

export function DropEditor({ mode, drop, products, media, waitlist, events = [], emailConfigured = false }: DropEditorProps) {
  const router = useRouter()
  const [state, setState] = React.useState<EditorState>(() => initialState(drop))
  const [mediaValues, setMediaValues] = React.useState<Record<string, MediaPickerValue | null>>({
    teaser: drop?.teaser_hero_media_id ? media[drop.teaser_hero_media_id] ?? null : null,
    mens: drop?.mens_campaign_media_id ? media[drop.mens_campaign_media_id] ?? null : null,
    womens: drop?.womens_campaign_media_id ? media[drop.womens_campaign_media_id] ?? null : null,
  })
  const [saving, setSaving] = React.useState(false)

  function patch<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setState((current) => ({ ...current, [key]: value }))
  }

  function setAsset(key: 'teaser' | 'mens' | 'womens', value: MediaPickerValue | null) {
    setMediaValues((current) => ({ ...current, [key]: value }))
    patch(key === 'teaser' ? 'teaser_hero_media_id' : key === 'mens' ? 'mens_campaign_media_id' : 'womens_campaign_media_id', value?.id ?? null)
  }

  function payload(): DropInput {
    return {
      ...state,
      description: state.description?.trim() || null,
      teaser_starts_at: iso(state.teaser_starts_at),
      teaser_ends_at: iso(state.teaser_ends_at),
      store_starts_at: iso(state.store_starts_at),
    }
  }

  async function save() {
    setSaving(true)
    const result = mode === 'create' ? await createDropAction(payload()) : await updateDropAction(drop!.id, payload())
    setSaving(false)
    if (!result.ok) return toast.error(result.error)
    toast.success(mode === 'create' ? 'Drop created.' : 'Drop saved.')
    if (mode === 'create' && result.data) router.push(`/admin/drops/${result.data.id}`)
    else router.refresh()
  }

  const checks = readiness(state)
  const complete = checks.filter((item) => item.complete).length
  const scheduledPhase = drop ? getScheduledPhase(drop) : null
  const missingReveal = revealReadiness({
    reveal_product_id: state.reveal_product_id,
    mens_campaign_media_id: state.mens_campaign_media_id,
    womens_campaign_media_id: state.womens_campaign_media_id,
  })
  const activePhase = drop?.current_phase ?? 'teaser'

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
      <div className="space-y-7">
        <Card>
          <CardHeader className="border-b border-border"><p className="admin-kicker">01 · Identity</p><CardTitle className="mt-1">The release brief</CardTitle><CardDescription>Give the drop a clear operational name. The number is unique within your store.</CardDescription></CardHeader>
          <CardContent className="grid gap-5 pt-5 sm:grid-cols-2">
            <div className="grid gap-2"><Label>Drop number</Label><Input value={state.drop_number} onChange={(event) => patch('drop_number', event.target.value)} className={fieldClass} placeholder="DROP 001" /></div>
            <div className="grid gap-2"><Label>Drop name</Label><Input value={state.name} onChange={(event) => patch('name', event.target.value)} className={fieldClass} placeholder="THE FOUNDATION" /></div>
            <div className="grid gap-2 sm:col-span-2"><Label>Internal description</Label><Textarea value={state.description ?? ''} onChange={(event) => patch('description', event.target.value)} className={fieldClass} placeholder="First DIR collection launch." rows={3} /></div>
          {drop?.status !== 'active' && <div className="grid gap-2"><Label>Record status</Label><Select value={state.status} onValueChange={(value) => patch('status', value as EditorState['status'])}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border"><p className="admin-kicker">02 · Teaser</p><CardTitle className="mt-1">Campaign and schedule</CardTitle></CardHeader>
          <CardContent className="grid gap-6 pt-5 lg:grid-cols-[13rem_minmax(0,1fr)]">
            <div><MediaPicker value={mediaValues.teaser} onChange={(value) => setAsset('teaser', value)} label="Teaser hero image" /><p className="mt-2 text-xs leading-5 text-muted-foreground">The full-screen visual customers will see during the teaser.</p></div>
            <div className="grid gap-5 sm:grid-cols-2"><div className="grid gap-2"><Label>Teaser starts</Label><Input type="datetime-local" value={state.teaser_starts_at} onChange={(event) => patch('teaser_starts_at', event.target.value)} /></div><div className="grid gap-2"><Label>Reveal begins</Label><Input type="datetime-local" value={state.teaser_ends_at} onChange={(event) => patch('teaser_ends_at', event.target.value)} /></div><div className="grid gap-2 sm:col-span-2"><Label>Store opens</Label><Input type="datetime-local" value={state.store_starts_at} onChange={(event) => patch('store_starts_at', event.target.value)} /></div><p className="text-xs leading-5 text-muted-foreground sm:col-span-2">Dates are saved as timezone-aware instants. Your store timezone determines the campaign schedule.</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border"><p className="admin-kicker">03 · First reveal</p><CardTitle className="mt-1">One product, two campaign views</CardTitle><CardDescription>The reveal intentionally focuses on a single product. Both campaign images are required before reveal can go live.</CardDescription></CardHeader>
          <CardContent className="grid gap-6 pt-5 lg:grid-cols-[minmax(0,1fr)_13rem_13rem]">
            <div className="grid gap-2"><Label>Reveal product</Label><Select value={state.reveal_product_id ?? '__none__'} onValueChange={(value) => patch('reveal_product_id', value === '__none__' ? null : value)}><SelectTrigger className="w-full"><SelectValue placeholder="Select the hero product" /></SelectTrigger><SelectContent><SelectItem value="__none__">No product selected</SelectItem>{products.map((product) => <SelectItem key={product.id} value={product.id}>{product.name}{product.status !== 'active' ? ' · Draft' : ''}</SelectItem>)}</SelectContent></Select>{missingReveal.length > 0 && <p className="text-xs text-amber-700">Reveal needs {missingReveal.join(', ')}.</p>}</div>
            <MediaPicker value={mediaValues.mens} onChange={(value) => setAsset('mens', value)} label="Men's campaign image" />
            <MediaPicker value={mediaValues.womens} onChange={(value) => setAsset('womens', value)} label="Women's campaign image" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border"><p className="admin-kicker">04 · Automation</p><CardTitle className="mt-1">Let the schedule lead</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between gap-5 pt-5"><div><p className="text-sm font-medium">Automatic transitions</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Trusted server-side scheduling moves teaser → reveal → store. Browser time is never used.</p></div><Switch checked={state.automatic_transitions_enabled} onCheckedChange={(checked) => patch('automatic_transitions_enabled', checked)} /></CardContent>
        </Card>

        <div className="flex justify-end"><Button size="lg" disabled={saving} onClick={() => void save()}>{saving ? <Loader2 className="animate-spin" /> : <Save />}{saving ? 'Saving…' : mode === 'create' ? 'Create drop' : 'Save changes'}</Button></div>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-8">
        <Card className="overflow-hidden border-foreground bg-foreground text-background"><CardContent className="p-5"><p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-background/60">Live experience</p><p className="mt-3 text-2xl font-semibold tracking-tight">{drop?.status === 'active' ? activePhase.toUpperCase() : 'NOT LIVE'}</p><p className="mt-2 text-sm leading-6 text-background/70">{drop?.status === 'active' ? `${drop.drop_number} · ${drop.name}` : 'Activate a configured drop to control the customer experience.'}</p>{drop && <Button asChild variant="outline" className="mt-5 border-background/30 bg-transparent text-background hover:bg-background hover:text-foreground"><Link href={`/admin/drops/${drop.id}/preview?phase=${activePhase}`}><ExternalLink />Preview live</Link></Button>}</CardContent></Card>

        <Card><CardHeader className="border-b border-border"><p className="admin-kicker">Configuration health</p><CardTitle className="mt-1">{complete}/{checks.length} ready</CardTitle></CardHeader><CardContent className="space-y-3 pt-5">{checks.map((item) => <div key={item.label} className="flex items-center gap-2 text-sm"><span className={`flex size-4 items-center justify-center rounded-full ${item.complete ? 'bg-emerald-600 text-white' : 'border border-amber-500 text-amber-700'}`}>{item.complete ? <Check className="size-3" /> : '!'}</span><span>{item.label}</span></div>)}</CardContent></Card>

        {drop && <Card><CardHeader className="border-b border-border"><p className="admin-kicker">Lifecycle control</p><CardTitle className="mt-1">{drop.status === 'active' ? 'Live controls' : 'Activation'}</CardTitle></CardHeader><CardContent className="space-y-4 pt-5"><div className="flex flex-wrap gap-x-4 gap-y-2"><PhaseStep phase="teaser" active={activePhase === 'teaser'} /><PhaseStep phase="reveal" active={activePhase === 'reveal'} /><PhaseStep phase="store" active={activePhase === 'store'} /></div>{scheduledPhase && <p className="flex items-center gap-2 text-xs leading-5 text-muted-foreground"><Clock3 className="size-3.5" />Schedule currently resolves to {scheduledPhase}.</p>}{drop.status !== 'active' ? <ConfirmDialog trigger={<Button className="w-full"><Zap />Activate drop</Button>} title={`Activate ${drop.drop_number}?`} description="If the teaser start is in the future, this schedules the campaign. Otherwise, it replaces any active drop and immediately controls the public experience." confirmLabel="Activate drop" onConfirm={async () => { const result = await activateDropAction(drop.id); if (!result.ok) toast.error(result.error); else { toast.success(result.data?.scheduled ? 'Drop scheduled. It will activate at the teaser start.' : result.data?.replacedDropName ? `Activated. ${result.data.replacedDropName} was completed.` : 'Drop activated.'); router.refresh() } }} /> : <><div className="grid grid-cols-3 gap-2">{(['teaser','reveal','store'] as DropPhase[]).map((phase) => <ConfirmDialog key={phase} trigger={<Button variant="outline" size="sm" disabled={phase === activePhase}>{phase}</Button>} title={`Move to ${phase}?`} description={`This immediately changes what customers see. ${phase === 'reveal' ? 'Launch notifications will be attempted once.' : ''}`} confirmLabel={`Move to ${phase}`} onConfirm={async () => { const result = await setDropPhaseAction(drop.id, { phase }); if (!result.ok) toast.error(result.error); else { toast.success(`Live phase moved to ${phase}.`); router.refresh() } }} />)}</div>{drop.manual_phase_override && <Button variant="outline" className="w-full" onClick={async () => { const result = await resumeDropAutomationAction(drop.id); if (!result.ok) toast.error(result.error); else { toast.success('Automatic schedule resumed.'); router.refresh() }}}><Play />Resume schedule</Button>}</>}</CardContent></Card>}

        {drop && waitlist && <Card><CardHeader className="border-b border-border"><p className="admin-kicker">Waitlist</p><CardTitle className="mt-1">{waitlist.total} subscribers</CardTitle></CardHeader><CardContent className="space-y-3 pt-5"><div className="grid grid-cols-3 gap-2 text-center text-xs"><span><b className="block text-base">{waitlist.waiting}</b>waiting</span><span><b className="block text-base">{waitlist.sent}</b>sent</span><span><b className="block text-base">{waitlist.failed}</b>failed</span></div>{!emailConfigured && <p className="border-l-2 border-amber-500 pl-3 text-xs leading-5 text-amber-800">Email delivery is not configured yet. Add the server-only Resend variables before sending a launch notification.</p>}<div className="grid gap-2"><ConfirmDialog trigger={<Button variant="outline" className="w-full" disabled={!emailConfigured || drop.current_phase === 'teaser' || waitlist.waiting === 0}><Send />Send launch notification</Button>} title={`Send launch notification to ${waitlist.waiting} subscribers?`} description="Each eligible subscriber is recorded so a duplicate launch email is never sent." confirmLabel="Send notification" onConfirm={async () => { const result = await sendDropLaunchNotificationAction(drop.id); if (!result.ok) toast.error(result.error); else { toast.success(`${result.data?.sent ?? 0} sent${result.data?.failed ? ` · ${result.data.failed} failed` : ''}.`); router.refresh() } }} />{waitlist.failed > 0 && <ConfirmDialog trigger={<Button variant="outline" className="w-full" disabled={!emailConfigured}><Mail />Retry failed</Button>} title={`Retry ${waitlist.failed} failed deliveries?`} confirmLabel="Retry failed" onConfirm={async () => { const result = await sendDropLaunchNotificationAction(drop.id, true); if (!result.ok) toast.error(result.error); else { toast.success(`${result.data?.sent ?? 0} resent.`); router.refresh() } }} />}</div><a href={`/api/admin/drops/${drop.id}/waitlist.csv`} className="block text-center text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Export waitlist CSV</a><div className="max-h-48 divide-y divide-border overflow-y-auto border-t pt-2">{waitlist.entries.length > 0 ? waitlist.entries.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 py-2 text-xs"><span className="min-w-0 truncate">{entry.email}</span><span className="shrink-0 capitalize text-muted-foreground">{entry.notification_status}</span></div>) : <p className="py-3 text-xs text-muted-foreground">No subscribers yet.</p>}</div></CardContent></Card>}

        {events.length > 0 && <Card><CardHeader className="border-b border-border"><p className="admin-kicker">Activity</p><CardTitle className="mt-1">Recent events</CardTitle></CardHeader><CardContent className="space-y-3 pt-5">{events.slice(0, 5).map((event) => <div key={event.id} className="border-l border-border pl-3 text-xs"><p className="font-medium capitalize">{event.transition_type === 'notification' ? 'Launch notification processed' : `${event.from_phase ?? '—'} → ${event.to_phase}`}</p><p className="mt-1 text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p></div>)}</CardContent></Card>}
      </aside>
    </div>
  )
}
