// Status badge metadata + lifecycle transition maps (docs/architecture.md §3).
// Consumed by src/components/ui/status-badge.tsx via getStatusMeta(kind, value).
//
// Enum unions already canonicalized in src/types/db/commerce.ts (order, both
// payment vocabularies, return, review, product) are imported and reused here
// rather than redefined. delivery/job/listing/enrollment have no db/types file
// yet (0003_delivery_cms_ops.sql isn't typed there yet), so those unions are
// defined locally, matching architecture §3 exactly.
import type {
  OrderStatus,
  PaymentStatus,
  PaymentVerificationStatus,
  ProductStatus,
  ReturnStatus,
  ReviewStatus,
} from '@/types/db/commerce'

export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'returned'

export type JobStatus = 'quoted' | 'scheduled' | 'in_progress' | 'done' | 'invoiced' | 'cancelled'

export type ListingStatus = 'draft' | 'active' | 'under_offer' | 'sold' | 'rented'

export type EnrollmentStatus = 'active' | 'completed' | 'revoked'

export type StatusKind =
  | 'order'
  | 'payment'
  | 'delivery'
  | 'product'
  | 'return'
  | 'job'
  | 'listing'
  | 'review'
  | 'enrollment'

/** Matches the `variant` prop of @/components/ui/badge.tsx's badgeVariants. */
export type StatusVariant = 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'

export interface StatusMeta {
  label: string
  variant: StatusVariant
}

function titleCase(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function buildStatusGroup(entries: [string, StatusVariant][]): Record<string, StatusMeta> {
  const group: Record<string, StatusMeta> = {}
  for (const [value, variant] of entries) {
    group[value] = { label: titleCase(value), variant }
  }
  return group
}

// order.status
const ORDER_ENTRIES: [OrderStatus, StatusVariant][] = [
  ['pending', 'warning'],
  ['pending_payment', 'warning'],
  ['payment_verification', 'warning'],
  ['confirmed', 'secondary'],
  ['preparing', 'secondary'],
  ['out_for_delivery', 'secondary'],
  ['packed', 'secondary'],
  ['dispatched', 'secondary'],
  ['delivered', 'success'],
  ['completed', 'success'],
  ['cancelled', 'destructive'],
  ['payment_rejected', 'destructive'],
  ['returned', 'destructive'],
  ['failed', 'destructive'],
]

// Merges payments.status (pending|verified|failed|refunded) and
// orders.payment_status (unpaid|advance_paid|paid|refunded|partial_refund) —
// both are legitimately passed to kind="payment"; 'refunded' is shared by both.
const PAYMENT_ENTRIES: [PaymentVerificationStatus | PaymentStatus, StatusVariant][] = [
  ['pending', 'warning'],
  ['verified', 'success'],
  ['failed', 'destructive'],
  ['refunded', 'destructive'],
  ['unpaid', 'warning'],
  ['advance_paid', 'warning'],
  ['paid', 'success'],
  ['partial_refund', 'destructive'],
]

const DELIVERY_ENTRIES: [DeliveryStatus, StatusVariant][] = [
  ['pending', 'warning'],
  ['assigned', 'secondary'],
  ['picked_up', 'secondary'],
  ['in_transit', 'secondary'],
  ['delivered', 'success'],
  ['failed', 'destructive'],
  ['returned', 'destructive'],
]

const PRODUCT_ENTRIES: [ProductStatus, StatusVariant][] = [
  ['draft', 'outline'],
  ['active', 'success'],
  ['archived', 'secondary'],
]

// Note: 'refunded' here means the return completed successfully (customer
// paid back as intended) — success, unlike the payment-side 'refunded' above.
const RETURN_ENTRIES: [ReturnStatus, StatusVariant][] = [
  ['requested', 'warning'],
  ['approved', 'success'],
  ['rejected', 'destructive'],
  ['received', 'secondary'],
  ['refunded', 'success'],
]

const JOB_ENTRIES: [JobStatus, StatusVariant][] = [
  ['quoted', 'outline'],
  ['scheduled', 'secondary'],
  ['in_progress', 'secondary'],
  ['done', 'success'],
  ['invoiced', 'success'],
  ['cancelled', 'destructive'],
]

const LISTING_ENTRIES: [ListingStatus, StatusVariant][] = [
  ['draft', 'outline'],
  ['active', 'success'],
  ['under_offer', 'warning'],
  ['sold', 'success'],
  ['rented', 'success'],
]

const REVIEW_ENTRIES: [ReviewStatus, StatusVariant][] = [
  ['pending', 'warning'],
  ['published', 'success'],
  ['rejected', 'destructive'],
]

const ENROLLMENT_ENTRIES: [EnrollmentStatus, StatusVariant][] = [
  ['active', 'success'],
  ['completed', 'success'],
  ['revoked', 'destructive'],
]

export const STATUS_MAP: Record<StatusKind, Record<string, StatusMeta>> = {
  order: buildStatusGroup(ORDER_ENTRIES),
  payment: buildStatusGroup(PAYMENT_ENTRIES),
  delivery: buildStatusGroup(DELIVERY_ENTRIES),
  product: buildStatusGroup(PRODUCT_ENTRIES),
  return: buildStatusGroup(RETURN_ENTRIES),
  job: buildStatusGroup(JOB_ENTRIES),
  listing: buildStatusGroup(LISTING_ENTRIES),
  review: buildStatusGroup(REVIEW_ENTRIES),
  enrollment: buildStatusGroup(ENROLLMENT_ENTRIES),
}

/** Falls back to a plain secondary badge for any value not in STATUS_MAP. */
export function getStatusMeta(kind: StatusKind, value: string): StatusMeta {
  return STATUS_MAP[kind]?.[value] ?? { label: titleCase(value), variant: 'secondary' }
}

// ---------------------------------------------------------------------------
// Lifecycle transition maps — allowed next-status sets.
// ---------------------------------------------------------------------------

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  // New clothing-store flow
  pending: ['pending_payment', 'cancelled'],
  pending_payment: ['payment_verification', 'cancelled'],
  payment_verification: ['confirmed', 'payment_rejected'],
  payment_rejected: ['pending_payment'],   // allow customer to resubmit
  confirmed: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'failed'],
  delivered: ['completed', 'returned'],
  completed: [],
  cancelled: [],
  returned: [],
  failed: [],
  // Legacy statuses (backward compat)
  packed: ['dispatched', 'cancelled'],
  dispatched: ['delivered', 'failed', 'returned'],
}

export const ORDER_TERMINAL_STATUSES: OrderStatus[] = [
  'completed',
  'cancelled',
  'returned',
  'failed',
  'payment_rejected',
]

/** Timestamp fields stamped on order when status transitions to that value. */
export const STATUS_STAMP_FIELD: Partial<Record<OrderStatus, string>> = {
  confirmed: 'confirmed_at',
  dispatched: 'dispatched_at',
  out_for_delivery: 'dispatched_at',
  delivered: 'delivered_at',
  cancelled: 'cancelled_at',
}

export const DELIVERY_STATUS_FLOW: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ['assigned'],
  assigned: ['picked_up', 'failed'],
  picked_up: ['in_transit', 'delivered', 'failed'],
  in_transit: ['delivered', 'failed', 'returned'],
  delivered: [],
  failed: [],
  returned: [],
}
