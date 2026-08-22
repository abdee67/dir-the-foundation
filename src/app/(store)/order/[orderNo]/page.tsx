import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, ArrowRight } from 'lucide-react'

import { formatMoney } from '@/lib/money'
import { getOrgSettings, getSetting } from '@/lib/settings'
import { getSingleStoreOrg } from '@/lib/store-org'
import { getAdminClient } from '@/lib/supabase/admin'
import type { PageProps } from '@/lib/types'
import type { Order, OrderItem } from '@/types/db'

export const dynamic = 'force-dynamic'

interface PaymentMethodConfig {
  name: string
  type: 'mobile_wallet' | 'bank'
  account_number?: string
  account_name: string
  phone?: string
}

type OrderRow = Pick<
  Order,
  | 'id'
  | 'order_no'
  | 'status'
  | 'payment_status'
  | 'customer_name'
  | 'subtotal'
  | 'discount_amount'
  | 'delivery_charge'
  | 'total'
  | 'placed_at'
>
type OrderItemRow = Pick<OrderItem, 'id' | 'product_name' | 'variant_name' | 'qty' | 'unit_price' | 'line_total'>

export default async function OrderConfirmationPage({ params, searchParams }: PageProps<{ orderNo: string }, { from?: string }>) {
  const { orderNo } = await params
  const { from } = await searchParams
  const isRevealFlow = from === 'reveal'
  const revealQuery = isRevealFlow ? '?from=reveal' : ''
  const org = await getSingleStoreOrg()
  const settings = await getOrgSettings(org.id)

  // Payment method instructions from org_settings
  const paymentMethods = getSetting<PaymentMethodConfig[]>(settings, 'payments.instructions') ?? []

  const supabase = getAdminClient()

  const { data: orderRow } = await supabase
    .from('orders')
    .select(
      'id, order_no, status, payment_status, customer_name, subtotal, discount_amount, delivery_charge, total, placed_at',
    )
    .eq('org_id', org.id)
    .eq('order_no', orderNo)
    .maybeSingle()

  if (!orderRow) notFound()
  const order = orderRow as OrderRow

  const { data: itemRows } = await supabase
    .from('order_items')
    .select('id, product_name, variant_name, qty, unit_price, line_total')
    .eq('org_id', org.id)
    .eq('order_id', order.id)

  const items = (itemRows ?? []) as OrderItemRow[]

  // Check if payment proof already submitted
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('org_id', org.id)
    .eq('order_id', order.id)
    .maybeSingle()

  const proofSubmitted = Boolean(existingPayment)

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8 lg:py-16">
      {/* Success header */}
      <div className="flex flex-col items-center gap-3 border-b border-neutral-900 pb-10 text-center">
        <div className="flex size-12 items-center justify-center border border-emerald-700 text-emerald-700">
          <CheckCircle2 className="size-6" />
        </div>
        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-500">Order received</p>
        <h1 className="sf-font-display text-3xl tracking-[-0.02em] text-neutral-900 sm:text-4xl">THANK YOU</h1>
        <p className="font-mono text-lg font-semibold tracking-[0.12em] text-neutral-900">{order.order_no}</p>
        <p className="max-w-md text-sm text-neutral-600">
          Thank you, {order.customer_name}. Save your order number to track your order.
        </p>
      </div>

      {/* Order summary */}
      <div className="mt-10 flex flex-col gap-5 border-y border-neutral-900 py-6">
        <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase">Order summary</h2>
        <ul className="flex flex-col divide-y divide-neutral-200">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-2.5 text-sm">
              <span>
                {item.product_name}
                {item.variant_name ? (
                <span className="text-neutral-500"> · {item.variant_name}</span>
              ) : null}
                <span className="text-neutral-500"> × {item.qty}</span>
              </span>
              <span className="tabular-nums">{formatMoney(item.line_total)}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 border-t border-neutral-200 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Subtotal</span>
            <span className="tabular-nums">{formatMoney(order.subtotal)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Discount</span>
              <span className="tabular-nums text-emerald-600">-{formatMoney(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Delivery</span>
            <span className="tabular-nums">
              {order.delivery_charge === 0 ? 'Free' : formatMoney(order.delivery_charge)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-base font-semibold">
            <span>Total paid</span>
            <span className="tabular-nums">{formatMoney(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment instructions */}
      {!proofSubmitted && (
        <div className="mt-8 flex flex-col gap-5 border-l-2 border-black bg-[#f5f4f2] px-5 py-5">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-500">Next step</p>
            <h2 className="mt-1 font-semibold text-neutral-900">
              Pay {formatMoney(order.total)}
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Send the exact amount to one of the accounts below, then upload your payment proof.
            </p>
          </div>

          {paymentMethods.length > 0 ? (
            <div className="flex flex-col gap-3">
              {paymentMethods.map((method, i) => (
                <div key={i} className="border-l border-neutral-300 bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-neutral-900">{method.name}</p>
                  {method.type === 'mobile_wallet' && method.phone && (
                    <p className="text-sm text-neutral-600">
                      Phone: <span className="font-mono font-medium">{method.phone}</span>
                    </p>
                  )}
                  {method.type === 'bank' && method.account_number && (
                    <p className="text-sm text-neutral-600">
                      Account: <span className="font-mono font-medium">{method.account_number}</span>
                    </p>
                  )}
                  <p className="text-sm text-neutral-600">
                    Name: <span className="font-medium">{method.account_name}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-l border-neutral-300 bg-white px-4 py-3">
              <p className="text-sm text-neutral-600">
                Payment instructions will be provided by the store. Contact us for details.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Already submitted proof */}
      {proofSubmitted && (
        <div className="mt-8 border-l-2 border-emerald-700 bg-emerald-50 px-5 py-4">
          <p className="text-sm font-medium text-emerald-900">
            Payment proof submitted — your order is under review.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {!proofSubmitted && (
          <Link
            href={`/payment/${order.order_no}${revealQuery}`}
            className="flex h-12 items-center justify-center border border-black bg-black px-4 text-[11px] font-semibold tracking-[0.14em] uppercase text-white transition-colors hover:bg-neutral-800"
          >
              Submit Payment Proof <ArrowRight className="ml-2 size-4" />
          </Link>
        )}
        <Link
          href={`/track?order=${order.order_no}${isRevealFlow ? '&from=reveal' : ''}`}
          className="flex h-12 items-center justify-center border border-black px-4 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors hover:bg-black hover:text-white"
        >
          Track order
        </Link>
        <Link
          href="/products"
          className="flex h-12 items-center justify-center border border-neutral-300 px-4 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors hover:border-black sm:col-span-2"
        >
          Continue shopping
        </Link>
      </div>

      <p className="mt-5 text-center text-xs text-neutral-500">
        Keep your order number <strong>{order.order_no}</strong> safe to track your order status.
      </p>
    </div>
  )
}
