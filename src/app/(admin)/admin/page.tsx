import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowUpRight, CheckCheck, CreditCard, Package, PackageCheck, Truck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { requireOrg } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function AdminDashboardPage() {
  const ctx = await requireOrg()
  const admin = getAdminClient()
  const [products, pendingPayments, confirmed, preparing, outForDelivery, delivered] = await Promise.all([
    admin.from('products').select('id', { count: 'exact', head: true }).eq('org_id', ctx.org.id),
    admin.from('payments').select('id', { count: 'exact', head: true }).eq('org_id', ctx.org.id).eq('status', 'pending'),
    admin.from('orders').select('id', { count: 'exact', head: true }).eq('org_id', ctx.org.id).eq('status', 'confirmed'),
    admin.from('orders').select('id', { count: 'exact', head: true }).eq('org_id', ctx.org.id).eq('status', 'preparing'),
    admin.from('orders').select('id', { count: 'exact', head: true }).eq('org_id', ctx.org.id).eq('status', 'out_for_delivery'),
    admin.from('orders').select('id', { count: 'exact', head: true }).eq('org_id', ctx.org.id).eq('status', 'delivered'),
  ])

  const queues = [
    { label: 'Payment verification', value: pendingPayments.count ?? 0, href: '/admin/payments', icon: CreditCard, tone: 'text-amber-700' },
    { label: 'Confirmed orders', value: confirmed.count ?? 0, href: '/admin/orders?status=confirmed', icon: CheckCheck, tone: 'text-emerald-700' },
    { label: 'Preparing', value: preparing.count ?? 0, href: '/admin/orders?status=preparing', icon: PackageCheck, tone: 'text-blue-700' },
    { label: 'Out for delivery', value: outForDelivery.count ?? 0, href: '/admin/orders?status=out_for_delivery', icon: Truck, tone: 'text-violet-700' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="DIR Operations"
        title={`${greetingFor(new Date().getHours())}, ${ctx.user.email?.split('@')[0] ?? 'there'}`}
        description={format(new Date(), 'EEEE, d MMMM yyyy')}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline"><Link href="/admin/orders">View orders</Link></Button>
            <Button asChild><Link href="/admin/products/new">New product</Link></Button>
          </div>
        }
      />

      <section aria-label="Store overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Catalog pieces" value={products.count ?? 0} hint="All product records" icon={Package} />
        <StatCard label="Awaiting payment" value={pendingPayments.count ?? 0} hint="Needs review" icon={CreditCard} />
        <StatCard label="In fulfilment" value={(confirmed.count ?? 0) + (preparing.count ?? 0)} hint="Confirmed and preparing" icon={PackageCheck} />
        <StatCard label="Delivered" value={delivered.count ?? 0} hint="Completed deliveries" icon={Truck} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)]">
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="admin-kicker">Today&apos;s workflow</p>
                <CardTitle className="mt-1">Operational queues</CardTitle>
              </div>
              <Button asChild variant="ghost" size="sm"><Link href="/admin/orders">All orders <ArrowUpRight className="size-3.5" /></Link></Button>
            </div>
          </CardHeader>
          <CardContent className="grid divide-y divide-border p-0 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {queues.map((queue) => {
              const Icon = queue.icon
              return (
                <Link key={queue.label} href={queue.href} className="group flex items-center justify-between gap-4 p-5 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className={`flex size-9 items-center justify-center border border-border bg-background ${queue.tone}`}><Icon className="size-4" /></span>
                    <span className="text-sm font-medium text-foreground">{queue.label}</span>
                  </div>
                  <span className="flex items-center gap-2 text-xl font-semibold tracking-[-0.04em] tabular-nums">
                    {queue.value}<ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              )
            })}
          </CardContent>
        </Card>

        <Card className="bg-[#171717] text-white dark:bg-card dark:text-card-foreground">
          <CardHeader>
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-white/55 dark:text-muted-foreground">Store control</p>
            <CardTitle className="mt-1 text-white dark:text-foreground">Keep the collection current.</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm leading-6 text-white/70 dark:text-muted-foreground">Update product availability, approve customer payment proofs, and keep delivery costs aligned with your service areas.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button asChild variant="secondary"><Link href="/admin/inventory">Inventory</Link></Button>
              <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white hover:text-black dark:border-border dark:text-foreground"><Link href="/admin/delivery-zones">Delivery zones</Link></Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
