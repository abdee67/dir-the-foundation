import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'

import { requireOrg, requireRole } from '@/lib/auth'
import { formatMoney } from '@/lib/money'
import { getAdminClient } from '@/lib/supabase/admin'
import { getPaymentScreenshotUrl } from '@/modules/storefront/actions'
import type { PageProps } from '@/lib/types'

import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { PaymentApproveRejectForm } from '@/components/admin/payment-approve-reject-form'

export const dynamic = 'force-dynamic'

interface OrderItemRow {
  id: string
  product_name: string
  variant_name: string | null
  qty: number
  unit_price: number
  line_total: number
}

export default async function AdminPaymentDetailPage({ params }: PageProps<{ paymentId: string }>) {
  const { paymentId } = await params
  const ctx = await requireOrg()
  requireRole(ctx, 'manager')

  const admin = getAdminClient()

  const { data: paymentData } = await admin
    .from('payments')
    .select(`
      id, status, method, kind, amount, provider_ref, note, created_at,
      screenshot_media_id,
      verified_by, verified_at,
      orders!inner(
        id, order_no, status, payment_status,
        customer_name, customer_phone,
        address, subtotal, discount_amount, delivery_charge, total
      )
    `)
    .eq('org_id', ctx.org.id)
    .eq('id', paymentId)
    .maybeSingle()

  if (!paymentData) notFound()

  // Supabase returns related rows as arrays when using !inner join — unwrap
  const rawPayment = paymentData as Record<string, unknown>
  const ordersArr = rawPayment.orders as unknown[]
  const orderRaw = (Array.isArray(ordersArr) ? ordersArr[0] : ordersArr) as {
    id: string; order_no: string; status: string; payment_status: string;
    customer_name: string; customer_phone: string;
    address: Record<string, string> | null;
    subtotal: number; discount_amount: number; delivery_charge: number; total: number
  }

  const p = {
    id: rawPayment.id as string,
    status: rawPayment.status as string,
    method: rawPayment.method as string,
    kind: rawPayment.kind as string,
    amount: rawPayment.amount as number,
    provider_ref: rawPayment.provider_ref as string | null,
    note: rawPayment.note as string | null,
    created_at: rawPayment.created_at as string,
    screenshot_media_id: rawPayment.screenshot_media_id as string | null,
    verified_by: rawPayment.verified_by as string | null,
    verified_at: rawPayment.verified_at as string | null,
    orders: orderRaw,
  }

  const order = p.orders

  // Get order items
  const { data: itemData } = await admin
    .from('order_items')
    .select('id, product_name, variant_name, qty, unit_price, line_total')
    .eq('order_id', order.id)

  const items = (itemData ?? []) as OrderItemRow[]

  // Get screenshot signed URL (private bucket — 5 min expiry)
  let screenshotUrl: string | null = null
  if (p.screenshot_media_id) {
    const { data: mediaRow } = await admin
      .from('media')
      .select('path')
      .eq('id', p.screenshot_media_id)
      .maybeSingle()
    const path = (mediaRow as { path: string } | null)?.path
    if (path) {
      screenshotUrl = await getPaymentScreenshotUrl(path)
    }
  }

  const isPending = p.status === 'pending'

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Finance desk"
        title="Payment review"
        description="Verify the submitted proof before moving this order into fulfilment."
        backHref="/admin/payments"
        actions={<Badge variant={p.status === 'verified' ? 'success' : p.status === 'failed' ? 'destructive' : 'warning'}>{p.status}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: order + payment details */}
        <div className="flex flex-col gap-6">
          {/* Order summary */}
          <div className="admin-surface flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="admin-section-title">
                Order{' '}
                <Link href={`/admin/orders/${order.id}`} className="font-mono text-primary hover:underline">
                  {order.order_no}
                </Link>
              </h2>
              <Badge variant={order.status === 'confirmed' ? 'success' : 'warning'}>
                {order.status.replace(/_/g, ' ')}
              </Badge>
            </div>

            {/* Customer */}
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer</p>
                <p className="mt-1 font-medium">{order.customer_name}</p>
                <p className="text-muted-foreground">{order.customer_phone}</p>
              </div>
              {order.address && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Delivery Address</p>
                  <p className="mt-1">
                    {[order.address.line1, order.address.area, order.address.district]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Items</p>
              <ul className="flex flex-col divide-y divide-border">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span>
                      {item.product_name}
                      {item.variant_name && (
                        <span className="text-muted-foreground"> · {item.variant_name}</span>
                      )}
                      <span className="text-muted-foreground"> × {item.qty}</span>
                    </span>
                    <span className="tabular-nums">{formatMoney(item.line_total)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span className="tabular-nums">{formatMoney(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount</span>
                    <span className="tabular-nums text-emerald-600">-{formatMoney(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span className="tabular-nums">{order.delivery_charge === 0 ? 'Free' : formatMoney(order.delivery_charge)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Due</span>
                  <span className="tabular-nums">{formatMoney(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment details */}
          <div className="admin-surface flex flex-col gap-4 p-5">
            <h2 className="admin-section-title">Payment details</h2>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Method</p>
                <p className="mt-1 font-medium">{p.method}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount Paid</p>
                <p className="mt-1 font-semibold tabular-nums">{formatMoney(p.amount)}</p>
                {p.amount !== order.total && (
                  <p className="text-xs text-amber-600">
                    {p.amount < order.total ? `Underpaid by ${formatMoney(order.total - p.amount)}` : `Overpaid by ${formatMoney(p.amount - order.total)}`}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">FT / Reference No.</p>
                <p className="mt-1 font-mono font-medium">{p.provider_ref ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Submitted</p>
                <p className="mt-1">{format(new Date(p.created_at), 'dd MMM yyyy, HH:mm')}</p>
              </div>
            </div>
            {p.note && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Note</p>
                <p className="text-sm text-muted-foreground">{p.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: screenshot + approve/reject */}
        <div className="flex flex-col gap-4">
          {/* Screenshot */}
          <div className="admin-surface flex flex-col gap-3 p-4">
            <h2 className="admin-section-title">Payment screenshot</h2>
            {screenshotUrl ? (
              <a href={screenshotUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshotUrl}
                  alt="Payment proof"
                  className="w-full border border-border object-contain"
                />
                <p className="mt-1 text-center text-xs text-muted-foreground">Click to open full size</p>
              </a>
            ) : (
              <div className="flex h-48 items-center justify-center bg-muted">
                <p className="text-sm text-muted-foreground">No screenshot</p>
              </div>
            )}
          </div>

          {/* Approve / Reject actions */}
          {isPending ? (
            <PaymentApproveRejectForm paymentId={p.id} orderId={order.id} />
          ) : (
            <div className="admin-surface p-4">
              <p className="text-sm font-medium">
                {p.status === 'verified' ? '✓ Payment Approved' : '✗ Payment Rejected'}
              </p>
              {p.verified_at && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {format(new Date(p.verified_at), 'dd MMM yyyy, HH:mm')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
