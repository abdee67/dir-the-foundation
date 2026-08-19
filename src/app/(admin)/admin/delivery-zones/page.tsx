import { MapPin, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { requireOrg, requireRole } from '@/lib/auth'
import { formatMoney } from '@/lib/money'
import { getAdminClient } from '@/lib/supabase/admin'
import { createDeliveryZoneAction } from '@/modules/delivery/actions'

export const dynamic = 'force-dynamic'

interface DeliveryZoneRow {
  id: string
  name: string
  districts: string[]
  charge: number
  eta_text: string | null
  is_active: boolean
}

export default async function DeliveryZonesPage() {
  const ctx = await requireOrg()
  requireRole(ctx, 'manager')
  const { data } = await getAdminClient()
    .from('delivery_zones')
    .select('id, name, districts, charge, eta_text, is_active')
    .eq('org_id', ctx.org.id)
    .order('position')
  const zones = (data ?? []) as DeliveryZoneRow[]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Fulfilment" title="Delivery zones" description="Set a delivery charge for each service area. Customers see the matching total at checkout." />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] xl:items-start">
        <Card>
          <CardHeader className="border-b border-border">
            <div>
              <p className="admin-kicker">Configured service areas</p>
              <CardTitle className="mt-1">Zones &amp; charges</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {zones.length === 0 ? (
              <EmptyState icon={MapPin} title="No delivery zones yet" description="Add your first zone using the form alongside this list." className="m-5" />
            ) : (
              <div className="divide-y divide-border">
                {zones.map((zone, index) => (
                  <div key={zone.id} className="grid gap-4 px-5 py-5 sm:grid-cols-[2.25rem_minmax(0,1fr)_auto] sm:items-center">
                    <span className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{zone.name}</p>
                        <Badge variant={zone.is_active ? 'success' : 'outline'}>{zone.is_active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {zone.districts.length > 0 ? zone.districts.join(', ') : 'All areas'}
                        {zone.eta_text ? ` · ${zone.eta_text}` : ''}
                      </p>
                    </div>
                    <p className="text-right text-base font-semibold tracking-[-0.02em] tabular-nums text-foreground">{formatMoney(zone.charge)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-8">
          <CardHeader>
            <p className="admin-kicker">New service area</p>
            <CardTitle className="mt-1">Add delivery zone</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createDeliveryZoneAction} className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="zone-name">Zone name</Label>
                <Input id="zone-name" name="name" required placeholder="e.g. Addis Ababa" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zone-areas">Districts / areas</Label>
                <Input id="zone-areas" name="areas" placeholder="Bole, CMC, Kazanchis" />
                <p className="text-xs leading-5 text-muted-foreground">Separate areas with commas. Leave blank to use this as a fallback zone.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
                <div className="grid gap-2">
                  <Label htmlFor="zone-charge">Delivery cost</Label>
                  <Input id="zone-charge" name="charge" type="number" min="0" step="0.01" required placeholder="0.00" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zone-eta">Delivery note</Label>
                  <Input id="zone-eta" name="eta_text" placeholder="Optional ETA" />
                </div>
              </div>
              <Button type="submit" className="mt-1"><Plus className="size-4" />Add zone</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
