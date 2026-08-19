'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ORDER_STATUS_FLOW } from '@/lib/status'
import type { OrderStatus } from '@/types/db'
import { updateOrderStatusAction } from '@/modules/orders/actions'

const STATUS_ACTION_LABEL: Record<OrderStatus, string> = {
  pending: 'Mark pending',
  pending_payment: 'Awaiting payment',
  payment_verification: 'Under verification',
  payment_rejected: 'Payment rejected',
  confirmed: 'Confirm',
  preparing: 'Mark preparing',
  out_for_delivery: 'Out for delivery',
  packed: 'Mark packed',
  dispatched: 'Dispatch',
  delivered: 'Mark delivered',
  completed: 'Complete',
  cancelled: 'Cancel order',
  returned: 'Mark returned',
  failed: 'Mark failed',
}

const DESTRUCTIVE_STATUSES = new Set<OrderStatus>(['cancelled', 'failed', 'payment_rejected'])
// Both move real state (stock reservation / cancellation) — confirm before firing.
const CONFIRM_REQUIRED = new Set<OrderStatus>(['cancelled', 'confirmed'])

interface OrderStatusActionsProps {
  orderId: string
  status: OrderStatus
}

function OrderStatusActions({ orderId, status }: OrderStatusActionsProps) {
  const router = useRouter()
  const [busy, setBusy] = React.useState<OrderStatus | null>(null)
  const nextStatuses = ORDER_STATUS_FLOW[status] ?? []

  async function run(nextStatus: OrderStatus) {
    setBusy(nextStatus)
    try {
      const result = await updateOrderStatusAction({ orderId, nextStatus })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(`Order updated to ${nextStatus}`)
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  if (nextStatuses.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      {nextStatuses.map((next) =>
        CONFIRM_REQUIRED.has(next) ? (
          <ConfirmDialog
            key={next}
            trigger={
              <Button variant={DESTRUCTIVE_STATUSES.has(next) ? 'destructive' : 'default'} size="sm" disabled={busy !== null}>
                {STATUS_ACTION_LABEL[next]}
              </Button>
            }
            title={`${STATUS_ACTION_LABEL[next]}?`}
            description={
              next === 'confirmed'
                ? 'This reserves stock for every item on this order.'
                : 'This cancels the order and restores any stock that was reserved.'
            }
            destructive={DESTRUCTIVE_STATUSES.has(next)}
            confirmLabel={STATUS_ACTION_LABEL[next]}
            onConfirm={() => run(next)}
          />
        ) : (
          <Button
            key={next}
            variant={DESTRUCTIVE_STATUSES.has(next) ? 'destructive' : 'outline'}
            size="sm"
            disabled={busy !== null}
            onClick={() => run(next)}
          >
            {busy === next ? 'Working…' : STATUS_ACTION_LABEL[next]}
          </Button>
        ),
      )}
    </div>
  )
}

export { OrderStatusActions }
