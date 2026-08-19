import { notFound } from 'next/navigation'

import { formatMoney } from '@/lib/money'
import { getOrgSettings, getSetting } from '@/lib/settings'
import { getSingleStoreOrg } from '@/lib/store-org'
import { getAdminClient } from '@/lib/supabase/admin'
import type { PageProps } from '@/lib/types'
import type { Order } from '@/types/db'

import { PaymentProofForm } from '@/components/store/payment-proof-form'

export const dynamic = 'force-dynamic'

interface PaymentMethodConfig {
  name: string
  type: 'mobile_wallet' | 'bank'
  account_number?: string
  account_name: string
  phone?: string
}

type OrderRow = Pick<Order, 'id' | 'order_no' | 'status' | 'payment_status' | 'total' | 'customer_name'>

export default async function PaymentPage({ params }: PageProps<{ orderNo: string }>) {
  const { orderNo } = await params
  const org = await getSingleStoreOrg()
  const settings = await getOrgSettings(org.id)
  const paymentMethods = getSetting<PaymentMethodConfig[]>(settings, 'payments.instructions') ?? []

  const supabase = getAdminClient()
  const { data: orderRow } = await supabase
    .from('orders')
    .select('id, order_no, status, payment_status, total, customer_name')
    .eq('org_id', org.id)
    .eq('order_no', orderNo)
    .maybeSingle()

  if (!orderRow) notFound()
  const order = orderRow as OrderRow

  // Check if proof already submitted — prevent duplicate submissions
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('org_id', org.id)
    .eq('order_id', order.id)
    .maybeSingle()

  const rejectedPayment = (existingPayment as { status?: string } | null)?.status === 'failed'
  if (existingPayment && !rejectedPayment) {
    // Already submitted — redirect them to order page
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-500">DIR (ድር) THE FOUNDATION</p>
        <h1 className="sf-font-display mt-2 text-3xl tracking-[-0.02em]">PAYMENT RECEIVED</h1>
        <p className="mt-3 text-sm text-neutral-600">
          We already received your payment proof for order{' '}
          <span className="font-mono font-semibold">{order.order_no}</span>. Your order is under review.
        </p>
        <a
          href={`/track?order=${order.order_no}`}
          className="mt-7 inline-flex h-12 items-center justify-center border border-black bg-black px-6 text-[11px] font-semibold tracking-[0.14em] uppercase text-white transition-colors hover:bg-neutral-800"
        >
          Track Your Order
        </a>
      </div>
    )
  }

  // Only allow proof submission for a fresh order or a rejected proof.
  if ((!rejectedPayment && order.status !== 'pending_payment') || order.payment_status !== 'unpaid') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-500">DIR (ድር) THE FOUNDATION</p>
        <h1 className="sf-font-display mt-2 text-3xl tracking-[-0.02em]">PAYMENT STATUS</h1>
        <p className="mt-3 text-sm text-neutral-600">
          This order ({order.order_no}) is not currently awaiting payment proof.
        </p>
        <a
          href={`/track?order=${order.order_no}`}
          className="mt-7 inline-flex h-12 items-center justify-center border border-black px-6 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors hover:bg-black hover:text-white"
        >
          Track your order
        </a>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-8 border-b border-neutral-900 pb-6">
        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-500">DIR (ድር) THE FOUNDATION</p>
        <h1 className="sf-font-display mt-2 text-3xl tracking-[-0.02em] text-neutral-900">PAYMENT PROOF</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Order <span className="font-mono font-semibold">{order.order_no}</span> ·{' '}
          <span className="font-semibold">{formatMoney(order.total)}</span>
        </p>
      </div>

      {rejectedPayment && (
        <p className="mb-6 border-l-2 border-amber-700 bg-amber-50 px-4 py-3 text-sm text-amber-900">Your previous proof was rejected. Please correct the issue and submit a new proof.</p>
      )}

      <PaymentProofForm
        orderId={order.id}
        orderNo={order.order_no}
        orderTotal={order.total}
        paymentMethods={paymentMethods}
        orgId={org.id}
      />
    </div>
  )
}
