'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { getOrgSettings, settingNum } from '@/lib/settings'
import { notify } from '@/lib/notify'
import { formatMoney } from '@/lib/money'
import type { ActionResult } from '@/lib/types'
import { createOrderCore } from '@/modules/orders/create-order'
import { getSingleStoreOrg } from '@/lib/store-org'
import {
  placeOrderSchema,
  quoteDeliverySchema,
  type CartItemInput,
  type PlaceOrderInput,
  type QuoteDeliveryInput,
} from './schemas'

// ===============================================================================================
// Shared internal helpers — server-side price/zone truth. Never trust client-supplied amounts
// (docs/conventions.md — Data access: "server-side price recomputation. Never trust client totals").
// ===============================================================================================

interface DeliveryZoneRow {
  id: string
  districts: string[]
  charge: number
  eta_text: string | null
}

export interface DeliveryQuote {
  zoneId: string | null
  charge: number
  etaText: string | null
  warning?: string
}

async function resolveDeliveryZone(
  orgId: string,
  district: string,
  settings: Record<string, unknown>,
): Promise<DeliveryQuote> {
  const supabase = getAdminClient()
  const { data } = await supabase
    .from('delivery_zones')
    .select('id, districts, charge, eta_text')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('position', { ascending: true })

  const zones = (data ?? []) as DeliveryZoneRow[]
  const needle = district.trim().toLowerCase()
  const match = zones.find((zone) => zone.districts.some((d) => d.trim().toLowerCase() === needle))

  if (match) {
    return {
      zoneId: match.id,
      charge: match.charge,
      etaText: match.eta_text,
    }
  }

  return {
    zoneId: null,
    charge: settingNum(settings, 'delivery.default_zone_fallback'),
    etaText: null,
    warning: 'No delivery zone is configured for this district yet — using the standard rate.',
  }
}

interface PricedProductRow {
  id: string
  name: string
  price: number
  category_id: string | null
  status: string
  track_stock: boolean
  stock_qty: number
  allow_backorder: boolean
}

interface PricedVariantRow {
  id: string
  product_id: string
  name: string
  price: number
  stock_qty: number
  options: Record<string, unknown>
}

export interface PricedLine {
  productId: string
  variantId: string | null
  name: string
  variantName: string | null
  unitPrice: number
  qty: number
  lineTotal: number
  trackStock: boolean
  stockQty: number
  allowBackorder: boolean
  categoryId: string | null
  imagePath: string | null
  variantOptions: Record<string, unknown>
}

async function getPrimaryImagePaths(orgId: string, productIds: string[]): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {}
  if (productIds.length === 0) return result

  const supabase = getAdminClient()
  const { data } = await supabase
    .from('product_images')
    .select('product_id, position, media:media_id(path)')
    .eq('org_id', orgId)
    .in('product_id', productIds)
    .order('position', { ascending: true })

  if (!data) return result

  for (const row of data as unknown as {
    product_id: string
    media: { path: string } | { path: string }[] | null
  }[]) {
    if (row.product_id in result) continue // keep first (lowest position) seen per product
    const media = Array.isArray(row.media) ? row.media[0] : row.media
    result[row.product_id] = media?.path ?? null
  }
  return result
}

/**
 * Re-fetches product/variant prices, stock, and category from the DB for a cart's line items —
 * the ONLY source of truth for money math. Rejects (returns ok:false) when an item no longer
 * exists/is inactive; stock-vs-qty is checked by the caller (price recomputation is silent per
 * the checkout contract, stock is not).
 */
async function priceCartItems(
  orgId: string,
  items: CartItemInput[],
): Promise<
  ActionResult<{ lines: PricedLine[]; subtotal: number; productIds: string[]; categoryIds: string[] }>
> {
  const supabase = getAdminClient()

  const productIds = [...new Set(items.map((i) => i.productId))]
  const { data: productRows, error: productError } = await supabase
    .from('products')
    .select('id, name, price, category_id, status, track_stock, stock_qty, allow_backorder')
    .eq('org_id', orgId)
    .in('id', productIds)

  if (productError || !productRows) return { ok: false, error: 'Could not load product prices.' }
  const products = new Map((productRows as PricedProductRow[]).map((p) => [p.id, p]))

  const variantIds = [...new Set(items.map((i) => i.variantId).filter((v): v is string => Boolean(v)))]
  let variants = new Map<string, PricedVariantRow>()
  if (variantIds.length > 0) {
    const { data: variantRows, error: variantError } = await supabase
      .from('product_variants')
      .select('id, product_id, name, price, stock_qty, options')
      .eq('org_id', orgId)
      .in('id', variantIds)
    if (variantError || !variantRows) return { ok: false, error: 'Could not load variant prices.' }
    variants = new Map((variantRows as PricedVariantRow[]).map((v) => [v.id, v]))
  }

  const imagePaths = await getPrimaryImagePaths(orgId, productIds)

  const lines: PricedLine[] = []
  for (const item of items) {
    const product = products.get(item.productId)
    if (!product || product.status !== 'active') {
      return { ok: false, error: 'One of the items in your cart is no longer available.' }
    }

    const variant = item.variantId ? variants.get(item.variantId) : undefined
    if (item.variantId && (!variant || variant.product_id !== item.productId)) {
      return { ok: false, error: 'One of the items in your cart is no longer available.' }
    }

    const unitPrice = variant ? variant.price : product.price
    const stockQty = variant ? variant.stock_qty : product.stock_qty

    lines.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      name: product.name,
      variantName: variant?.name ?? null,
      unitPrice,
      qty: item.qty,
      lineTotal: unitPrice * item.qty,
      trackStock: product.track_stock,
      stockQty,
      allowBackorder: product.allow_backorder,
      categoryId: product.category_id,
      imagePath: imagePaths[product.id] ?? null,
      variantOptions: variant?.options ?? {},
    })
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0)
  const outProductIds = [...new Set(lines.map((l) => l.productId))]
  const categoryIds = [...new Set(lines.map((l) => l.categoryId).filter((c): c is string => Boolean(c)))]

  return { ok: true, data: { lines, subtotal, productIds: outProductIds, categoryIds } }
}

function optionValue(options: Record<string, unknown>, key: 'fit' | 'color' | 'size'): string | null {
  const value = options[key]
  return typeof value === 'string' ? value : null
}

/** Revalidates launch-only choices after canonical product/variant pricing. */
async function validateRevealLines(orgId: string, items: CartItemInput[], lines: PricedLine[]): Promise<ActionResult<Record<string, unknown>[]>> {
  const revealEntries = items.map((item, index) => ({ item, line: lines[index] })).filter((entry) => entry.item.reveal)
  if (revealEntries.length === 0) return { ok: true, data: lines.map(() => ({})) }
  const dropIds = [...new Set(revealEntries.map((entry) => entry.item.reveal!.dropId))]
  const supabase = getAdminClient()
  const [{ data: drops, error }, { data: revealVariants, error: revealVariantError }] = await Promise.all([
    supabase.from('drops').select('id, reveal_product_id, status, current_phase').eq('org_id', orgId).in('id', dropIds),
    supabase.from('product_variants').select('product_id').eq('org_id', orgId).in('product_id', [...new Set(revealEntries.map((entry) => entry.line.productId))]),
  ])
  if (error || revealVariantError) return { ok: false, error: 'The reveal is temporarily unavailable. Please try again.' }
  const activeDrops = new Map((drops ?? []).filter((drop) => drop.status === 'active' && drop.current_phase === 'reveal').map((drop) => [drop.id, drop]))
  const productsWithVariants = new Set((revealVariants ?? []).map((variant) => variant.product_id))
  const configurations: Record<string, unknown>[] = []
  for (let index = 0; index < items.length; index += 1) {
    const reveal = items[index].reveal
    const line = lines[index]
    if (!reveal) { configurations.push({}); continue }
    const drop = activeDrops.get(reveal.dropId)
    if (!drop || drop.reveal_product_id !== line.productId || (productsWithVariants.has(line.productId) && !line.variantId)) return { ok: false, error: 'This reveal selection is no longer available.' }
    const fit = optionValue(line.variantOptions, 'fit')
    const color = optionValue(line.variantOptions, 'color')
    const size = optionValue(line.variantOptions, 'size')
    if ((reveal.fit && reveal.fit !== fit) || (reveal.color && reveal.color !== color) || (reveal.size && reveal.size !== size)) return { ok: false, error: 'Your reveal selection changed. Please choose an available option again.' }
    if (reveal.purchaseType === 'pre_order' && reveal.customizationText && reveal.customizationText.length > 10) return { ok: false, error: 'Customization must be 10 characters or fewer.' }
    if (reveal.purchaseType === 'buy_now' && reveal.customizationText) return { ok: false, error: 'Customization is only available for pre-orders.' }
    configurations.push({ drop_id: reveal.dropId, purchase_type: reveal.purchaseType, fit, color, size, customization_text: reveal.customizationText ?? null })
  }
  return { ok: true, data: configurations }
}

// ===============================================================================================
// quoteDeliveryAction — district -> zone charge/eta, with a settings-driven fallback.
// ===============================================================================================

export async function quoteDeliveryAction(input: QuoteDeliveryInput): Promise<ActionResult<DeliveryQuote>> {
  const parsed = quoteDeliverySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  try {
    const org = await getSingleStoreOrg()
    if (parsed.data.orgSlug !== org.slug) return { ok: false, error: 'Store not found' }

    const settings = await getOrgSettings(org.id)
    return { ok: true, data: await resolveDeliveryZone(org.id, parsed.data.district, settings) }
  } catch (err) {
    console.error('[storefront:quoteDeliveryAction]', err)
    return { ok: false, error: 'Could not calculate delivery charge. Please try again.' }
  }
}

// ===============================================================================================
// placeOrderAction — the checkout chokepoint. zod-validates, re-prices everything server-side,
// runs the blocklist/advance/payment-method rules, then hands off to the orders slice's shared
// createOrderCore. Never marks a payment verified — that stays the admin verifyPayment() chokepoint.
// ===============================================================================================

export interface PlaceOrderResult {
  orderNo: string
}

export async function placeOrderAction(input: PlaceOrderInput): Promise<ActionResult<PlaceOrderResult>> {
  const parsed = placeOrderSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' }
  }
  const data = parsed.data

  try {
    const org = await getSingleStoreOrg()
    if (data.orgSlug !== org.slug) return { ok: false, error: 'Store not found' }

    const settings = await getOrgSettings(org.id)

    // 1. price + stock truth — NEVER trust client amounts ----------------------------------------
    const priced = await priceCartItems(org.id, data.items)
    if (!priced.ok) return priced
    if (!priced.data) return { ok: false, error: 'Could not price your cart.' }
    const { lines, subtotal } = priced.data
    const revealValidation = await validateRevealLines(org.id, data.items, lines)
    if (!revealValidation.ok || !revealValidation.data) {
      return { ok: false, error: revealValidation.ok ? 'Could not validate the reveal selection.' : revealValidation.error }
    }
    const revealConfigurations = revealValidation.data

    for (const line of lines) {
      if (line.trackStock && !line.allowBackorder && line.qty > Math.max(line.stockQty, 0)) {
        return { ok: false, error: `${line.name} only has ${Math.max(line.stockQty, 0)} left in stock.` }
      }
    }

    if (subtotal < settingNum(settings, 'checkout.min_order')) {
      return { ok: false, error: 'Your order is below the minimum order amount for this store.' }
    }

    // 2. delivery zone --------------------------------------------------------------------------
    const zone = await resolveDeliveryZone(org.id, data.address.district, settings)

    // 3. create order with status pending_payment — NO payment row yet.
    //    Payment proof is submitted separately on /payment/[orderNo] after order creation.
    // Build a date-based order number prefix: ORD-YYYYMMDD-
    const today = new Date()
    const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    const orderPrefix = `ORD-${ymd}-`

    const result = await createOrderCore({
      org_id: org.id,
      channel: 'storefront',
      status: 'pending_payment',
      payment_status: 'unpaid',
      customer: { name: data.contact.name, phone: data.contact.phone, email: data.contact.email ?? null },
      address: { line1: data.address.line1, area: data.address.area ?? null, district: data.address.district },
      delivery_zone_id: zone.zoneId,
      delivery_charge: zone.charge,
      items: lines.map((l, index) => ({
        product_id: l.productId,
        variant_id: l.variantId,
        product_name: l.name,
        variant_name: l.variantName,
        image_path: l.imagePath,
        unit_price: l.unitPrice,
        qty: l.qty,
        configuration: revealConfigurations[index],
      })),
      discount_code: null,
      discount_amount: 0,
      tax_amount: 0,
      advance_due: 0,
      advance_paid: 0,
      payment_method: 'manual',
      risk_level: null,
      risk_note: null,
      note_customer: data.noteCustomer ?? null,
      source_meta: null,
      actor_id: null,
      decrement_stock: false,
      order_prefix: orderPrefix,
    })

    await notify(org.id, 'order_placed', {
      title: `New order ${result.orderNo}`,
      body: `${data.contact.name} — ${formatMoney(result.total)}`,
      link: `/admin/orders/${result.orderId}`,
    })

    return { ok: true, data: { orderNo: result.orderNo } }
  } catch (err) {
    console.error('[storefront:placeOrderAction]', err)
    return { ok: false, error: 'Could not place your order. Please try again.' }
  }
}

// ===============================================================================================
// submitPaymentProofAction — customer uploads screenshot + FT number after placing order.
// Uses service-role client so anon users can upload to the private payment-proofs bucket.
// ===============================================================================================

export interface SubmitPaymentProofInput {
  orderId: string
  orgId: string
  paymentMethod: string
  transactionNumber: string
  amount: number // in paisa
  screenshotBase64: string // base64-encoded image
  screenshotMimeType: string
  screenshotFileName: string
}

export async function submitPaymentProofAction(
  input: SubmitPaymentProofInput,
): Promise<ActionResult<{ paymentId: string }>> {
  try {
    const admin = getAdminClient()

    // Validate the order exists and is in pending_payment state
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, org_id, order_no, status, payment_status, total')
      .eq('id', input.orderId)
      .eq('org_id', input.orgId)
      .maybeSingle()

    if (orderErr || !order) return { ok: false, error: 'Order not found.' }

    const o = order as { id: string; org_id: string; order_no: string; status: string; payment_status: string; total: number }

    if (!['pending_payment', 'payment_rejected'].includes(o.status) || o.payment_status !== 'unpaid') {
      return { ok: false, error: 'This order is not awaiting payment.' }
    }

    if (!Number.isSafeInteger(input.amount) || input.amount <= 0 || input.amount > o.total * 10) {
      return { ok: false, error: 'Enter a valid payment amount.' }
    }

    // A rejected proof may be replaced; a pending or verified proof may not.
    const { data: existing } = await admin
      .from('payments')
      .select('id, status, screenshot_media_id')
      .eq('order_id', input.orderId)
      .maybeSingle()
    const existingPayment = existing as { id: string; status: string; screenshot_media_id: string | null } | null
    if (existingPayment && existingPayment.status !== 'failed') {
      return { ok: false, error: 'Payment proof already submitted for this order.' }
    }

    // Validate MIME type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedMimes.includes(input.screenshotMimeType)) {
      return { ok: false, error: 'Screenshot must be a JPG, PNG, WEBP or GIF image.' }
    }

    // Decode base64 and check size (max 5MB)
    const base64Data = input.screenshotBase64.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    if (buffer.byteLength > 5 * 1024 * 1024) {
      return { ok: false, error: 'Screenshot must be smaller than 5MB.' }
    }

    // Upload to private payment-proofs bucket
    const ext = input.screenshotMimeType.split('/')[1] ?? 'jpg'
    const filePath = `${input.orgId}/${input.orderId}/${Date.now()}.${ext}`

    const { error: uploadError } = await admin.storage
      .from('payment-proofs')
      .upload(filePath, buffer, { contentType: input.screenshotMimeType, upsert: false })

    if (uploadError) {
      console.error('[submitPaymentProofAction] upload error', uploadError)
      return { ok: false, error: 'Could not upload screenshot. Please try again.' }
    }

    // Insert media row for consistency with existing media system
    const { data: mediaRow, error: mediaErr } = await admin
      .from('media')
      .insert({
        org_id: input.orgId,
        path: filePath,
        name: input.screenshotFileName,
        mime: input.screenshotMimeType,
        size: buffer.byteLength,
      })
      .select('id')
      .single()

    if (mediaErr || !mediaRow) {
      console.error('[submitPaymentProofAction] media insert error', mediaErr)
      // Don't fail the whole flow — the file is uploaded, media row is secondary
    }

    const mediaId = (mediaRow as { id: string } | null)?.id ?? null

    const paymentPayload = {
      method: input.paymentMethod.trim().slice(0, 80),
      amount: Math.round(input.amount),
      status: 'pending',
      provider_ref: input.transactionNumber.trim().slice(0, 120),
      screenshot_media_id: mediaId,
      note: null,
      verified_by: null,
      verified_at: null,
    }
    const { data: payment, error: paymentErr } = existingPayment
      ? await admin.from('payments').update(paymentPayload).eq('id', existingPayment.id).select('id').single()
      : await admin.from('payments').insert({ org_id: input.orgId, order_id: input.orderId, kind: 'full', ...paymentPayload }).select('id').single()

    if (paymentErr || !payment) {
      return { ok: false, error: 'Could not save payment details. Please try again.' }
    }

    // Transition order to payment_verification
    await admin
      .from('orders')
      .update({ status: 'payment_verification' })
      .eq('id', input.orderId)

    // Write order event
    await admin.from('order_events').insert({
      org_id: input.orgId,
      order_id: input.orderId,
      type: 'status',
      message: `Status changed: ${o.status} -> payment_verification`,
      data: { from: o.status, to: 'payment_verification' },
      actor_id: null,
    })

    await admin.from('order_events').insert({
      org_id: input.orgId,
      order_id: input.orderId,
      type: 'payment',
      message: `${existingPayment ? 'Payment proof resubmitted' : 'Payment proof submitted'}: ${input.paymentMethod} — ref: ${input.transactionNumber}`,
      data: { paymentId: (payment as { id: string }).id },
      actor_id: null,
    })

    await notify(input.orgId, 'payment_received', {
      title: `Payment proof for ${o.order_no}`,
      body: `Method: ${input.paymentMethod} — Ref: ${input.transactionNumber}`,
      link: `/admin/payments`,
    })

    return { ok: true, data: { paymentId: (payment as { id: string }).id } }
  } catch (err) {
    console.error('[storefront:submitPaymentProofAction]', err)
    return { ok: false, error: 'Could not submit payment proof. Please try again.' }
  }
}

// ===============================================================================================
// trackOrderAction — public order tracking, no authentication required.
// Calls the get_order_status SECURITY DEFINER function.
// ===============================================================================================

export interface OrderTrackResult {
  orderNo: string
  status: string
  paymentStatus: string
  customerName: string
  placedAt: string
  events: { type: string; message: string; created_at: string }[]
}

export async function trackOrderAction(
  orderNo: string,
  phone: string,
): Promise<ActionResult<OrderTrackResult>> {
  const trimmedOrder = orderNo.trim().toUpperCase()
  const trimmedPhone = phone.trim()

  if (!trimmedOrder || !trimmedPhone) {
    return { ok: false, error: 'Enter your order number and phone number.' }
  }

  try {
    const admin = getAdminClient()
    const { data, error } = await admin.rpc('get_order_status', {
      p_order_no: trimmedOrder,
      p_phone: trimmedPhone,
    })

    if (error) {
      console.error('[trackOrderAction]', error)
      return { ok: false, error: 'Could not look up your order. Please try again.' }
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return { ok: false, error: 'Order not found. Check your order number and phone number.' }
    }

    const row = Array.isArray(data) ? data[0] : data
    return {
      ok: true,
      data: {
        orderNo: row.order_no,
        status: row.status,
        paymentStatus: row.payment_status,
        customerName: row.customer_name,
        placedAt: row.placed_at,
        events: (row.events ?? []) as { type: string; message: string; created_at: string }[],
      },
    }
  } catch (err) {
    console.error('[storefront:trackOrderAction]', err)
    return { ok: false, error: 'Could not look up your order. Please try again.' }
  }
}

// ===============================================================================================
// getPaymentScreenshotUrl — generates a short-lived signed URL for the admin to view a payment
// screenshot. Server-side only, never exposed to the storefront.
// ===============================================================================================

export async function getPaymentScreenshotUrl(filePath: string): Promise<string | null> {
  try {
    const admin = getAdminClient()
    const { data } = await admin.storage
      .from('payment-proofs')
      .createSignedUrl(filePath, 300) // 5-minute expiry
    return data?.signedUrl ?? null
  } catch {
    return null
  }
}
