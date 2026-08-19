import QRCode from 'qrcode'

import { getAdminClient } from '@/lib/supabase/admin'
import { getOrgSettings } from '@/lib/settings'
import type { Order, OrderItem, Org, Payment } from '@/types/db'

// Server-only (transitively guarded: getAdminClient's module throws if ever pulled
// into a client bundle — see src/lib/supabase/admin.ts). Consumed by the (print)
// pages and nothing client-side, per docs/architecture.md §9.

/**
 * Returns the order's invoice number, assigning one on first call.
 *
 * Numbering is lazy: the first print of an order's invoice mints INV-##### via the
 * next_doc_number RPC and persists it as an order_events marker (type 'system',
 * message 'invoice_no', data { invoice_no }); every later call (reprints) finds that
 * marker and returns the same number instead of consuming a new sequence value.
 */
export async function ensureInvoiceNumber(orderId: string): Promise<string> {
  const supabase = getAdminClient()

  const { data: existingEvent } = await supabase
    .from('order_events')
    .select('data')
    .eq('order_id', orderId)
    .eq('type', 'system')
    .eq('message', 'invoice_no')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const existingInvoiceNo = (existingEvent?.data as { invoice_no?: string } | null)?.invoice_no
  if (existingInvoiceNo) return existingInvoiceNo

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, org_id')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    throw new Error(`ensureInvoiceNumber: order ${orderId} not found`)
  }

  const { data: invoiceNo, error: rpcError } = await supabase.rpc('next_doc_number', {
    p_org: order.org_id,
    p_doc_type: 'invoice',
    p_prefix: 'INV-',
  })

  if (rpcError || !invoiceNo) {
    throw new Error(`ensureInvoiceNumber: next_doc_number RPC failed — ${rpcError?.message}`)
  }

  const { error: insertError } = await supabase.from('order_events').insert({
    org_id: order.org_id,
    order_id: orderId,
    type: 'system',
    message: 'invoice_no',
    data: { invoice_no: invoiceNo },
  })

  if (insertError) {
    // Non-fatal: worst case a reprint mints another number. Still return this one.
    console.error('[receipt] failed to persist invoice_no event', insertError)
  }

  return invoiceNo as string
}

/** Renders `text` (typically a track URL) as a PNG data URL for the receipt QR block. */
export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 240,
    color: { dark: '#000000', light: '#ffffff' },
  })
}

export interface ReceiptContext {
  org: Org
  order: Order
  items: OrderItem[]
  /** Verified payments only (payments.status = 'verified') — pending/failed rows are noise on a receipt. */
  payments: Payment[]
  settings: Record<string, unknown>
}

/**
 * Loads everything a print template needs for one order, via the admin (service-role)
 * client. Callers are responsible for the authorization check — compare
 * `context.order.org_id` against the caller's session org before rendering anything
 * (docs/conventions.md — print pages: "requireOrg + verify order org match").
 */
export async function getReceiptContext(orderId: string): Promise<ReceiptContext | null> {
  const supabase = getAdminClient()

  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single()
  if (!order) return null

  const [orgResult, itemsResult, paymentsResult, settings] = await Promise.all([
    supabase.from('orgs').select('*').eq('id', order.org_id).single(),
    supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true }),
    supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'verified')
      .order('created_at', { ascending: true }),
    getOrgSettings(order.org_id as string),
  ])

  if (!orgResult.data) return null

  return {
    org: orgResult.data as Org,
    order: order as Order,
    items: (itemsResult.data ?? []) as OrderItem[],
    payments: (paymentsResult.data ?? []) as Payment[],
    settings,
  }
}
