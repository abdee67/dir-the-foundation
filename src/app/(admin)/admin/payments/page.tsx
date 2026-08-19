import Link from 'next/link'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, Clock, ImageIcon } from 'lucide-react'

import { requireOrg } from '@/lib/auth'
import { formatMoney } from '@/lib/money'
import { getAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'

export const dynamic = 'force-dynamic'

interface PaymentRow {
  id: string
  status: string
  method: string
  amount: number
  provider_ref: string | null
  created_at: string
  screenshot_media_id: string | null
  screenshot_path: string | null
  order_id: string
  order_no: string
  customer_name: string
  customer_phone: string
  order_total: number
  note: string | null
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'verified') return <Badge variant="success">Approved</Badge>
  if (status === 'failed')   return <Badge variant="destructive">Rejected</Badge>
  return <Badge variant="warning">Pending</Badge>
}

export default async function AdminPaymentsPage() {
  const ctx = await requireOrg()
  const admin = getAdminClient()

  const { data } = await admin
    .from('payments')
    .select(`
      id, status, method, amount, provider_ref, created_at, note,
      screenshot_media_id,
      orders!inner(id, order_no, customer_name, customer_phone, total)
    `)
    .eq('org_id', ctx.org.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Resolve screenshot media paths
  const mediaIds = (data ?? [])
    .map((r: unknown) => (r as { screenshot_media_id: string | null }).screenshot_media_id)
    .filter((id): id is string => Boolean(id))

  let mediaMap: Record<string, string> = {}
  if (mediaIds.length > 0) {
    const { data: mediaRows } = await admin
      .from('media')
      .select('id, path')
      .in('id', mediaIds)
    for (const m of (mediaRows ?? []) as { id: string; path: string }[]) {
      mediaMap[m.id] = m.path
    }
  }

  const rows: PaymentRow[] = (data ?? []).map((r: unknown) => {
    const row = r as {
      id: string; status: string; method: string; amount: number;
      provider_ref: string | null; created_at: string; note: string | null;
      screenshot_media_id: string | null;
      orders: ({ id: string; order_no: string; customer_name: string; customer_phone: string; total: number } | { id: string; order_no: string; customer_name: string; customer_phone: string; total: number }[])
    }
    // Unwrap array (Supabase inner join returns arrays for relations)
    const ordersData = Array.isArray(row.orders) ? row.orders[0] : row.orders
    const orderData = ordersData as { id: string; order_no: string; customer_name: string; customer_phone: string; total: number }
    return {
      id: row.id,
      status: row.status,
      method: row.method,
      amount: row.amount,
      provider_ref: row.provider_ref,
      created_at: row.created_at,
      note: row.note,
      screenshot_media_id: row.screenshot_media_id,
      screenshot_path: row.screenshot_media_id ? (mediaMap[row.screenshot_media_id] ?? null) : null,
      order_id: orderData.id,
      order_no: orderData.order_no,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      order_total: orderData.total,
    }
  })

  const pending  = rows.filter((r) => r.status === 'pending')
  const verified = rows.filter((r) => r.status === 'verified')
  const failed   = rows.filter((r) => r.status === 'failed')

  function renderTable(list: PaymentRow[], showActions: boolean) {
    if (list.length === 0) return null
    return (
      <div className="admin-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/55 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">FT/Ref</th>
              <th className="px-4 py-3">Screenshot</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              {showActions && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border last:border-0 transition-colors hover:bg-muted/35"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${row.order_id}`}
                    className="font-mono text-xs font-medium text-primary hover:underline"
                  >
                    {row.order_no}
                  </Link>
                  <p className="text-xs text-muted-foreground">{formatMoney(row.order_total)}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{row.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{row.customer_phone}</p>
                </td>
                <td className="px-4 py-3 text-xs">{row.method}</td>
                <td className="px-4 py-3 tabular-nums font-medium">{formatMoney(row.amount)}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.provider_ref ?? '—'}</td>
                <td className="px-4 py-3">
                  {row.screenshot_path ? (
                    <Link href={`/admin/payments/${row.id}`} className="inline-flex size-9 items-center justify-center border border-border text-primary transition-colors hover:bg-muted" aria-label={`Review payment screenshot for ${row.order_no}`}>
                      <ImageIcon className="size-4" />
                    </Link>
                  ) : (
                    <div className="flex size-9 items-center justify-center bg-muted">
                      <ImageIcon className="size-4 text-muted-foreground" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(row.created_at), 'dd MMM yy, HH:mm')}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                {showActions && (
                  <td className="px-4 py-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/payments/${row.id}`}>Review</Link>
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Finance desk"
        title="Payment verification"
        description="Review customer payment proofs and keep the fulfilment queue moving."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Needs review" value={pending.length} icon={Clock} />
        <StatCard label="Approved" value={verified.length} icon={CheckCircle2} />
        <StatCard label="Rejected" value={failed.length} icon={XCircle} />
      </div>

      {/* Pending */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-amber-500" />
          <h2 className="admin-section-title">Pending verification</h2>
          {pending.length > 0 && (
            <span className="bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              {pending.length}
            </span>
          )}
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending payments.</p>
        ) : (
          renderTable(pending, true)
        )}
      </section>

      {/* Approved */}
      {verified.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <h2 className="admin-section-title">Approved</h2>
          </div>
          {renderTable(verified, false)}
        </section>
      )}

      {/* Rejected */}
      {failed.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <XCircle className="size-4 text-destructive" />
            <h2 className="admin-section-title">Rejected</h2>
          </div>
          {renderTable(failed, false)}
        </section>
      )}

      {rows.length === 0 && (
        <EmptyState
          icon={Clock}
          title="No payments yet"
          description="Payment proofs submitted by customers will appear here."
        />
      )}
    </div>
  )
}
