'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, Loader2, AlertCircle, RotateCcw } from 'lucide-react'

import { trackOrderAction, type OrderTrackResult } from '@/modules/storefront/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface OrderTrackFormProps {
  initialOrder?: string
  initialPhone?: string
}

// The public-facing status journey. Statuses that are not in this list
// (e.g. legacy 'packed'/'dispatched') are shown as a generic step.
const STATUS_STEPS: { key: string; label: string }[] = [
  { key: 'pending_payment',       label: 'Order Submitted'       },
  { key: 'payment_verification',  label: 'Payment Verification'  },
  { key: 'confirmed',             label: 'Payment Confirmed'      },
  { key: 'preparing',             label: 'Preparing'              },
  { key: 'out_for_delivery',      label: 'Out for Delivery'       },
  { key: 'delivered',             label: 'Delivered'              },
]

// Map legacy / extra statuses to a step index so the progress indicator
// can still position them correctly.
const STATUS_INDEX_MAP: Record<string, number> = {
  pending:              0,
  pending_payment:      0,
  payment_verification: 1,
  confirmed:            2,
  packed:               3,   // legacy → same as preparing
  preparing:            3,
  dispatched:           4,   // legacy → same as out_for_delivery
  out_for_delivery:     4,
  delivered:            5,
  completed:            5,
}

function getStepIndex(status: string): number {
  return STATUS_INDEX_MAP[status] ?? -1
}

const CANCELLED_STATUSES = ['cancelled', 'failed', 'payment_rejected', 'returned']

function StatusTimeline({ result }: { result: OrderTrackResult }) {
  const isCancelled = CANCELLED_STATUSES.includes(result.status)
  const isRejected  = result.status === 'payment_rejected'
  const currentIdx  = getStepIndex(result.status)

  if (isCancelled) {
    return (
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-start gap-3 border-l-2 border-red-700 bg-red-50 px-4 py-4">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">
              {isRejected ? 'Payment Rejected' : 'Order Cancelled'}
            </p>
            {isRejected && (
              <p className="mt-1 text-sm text-muted-foreground">
                Your payment proof was not verified. Please resubmit payment proof.
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              Order: <span className="font-mono font-semibold">{result.orderNo}</span>
            </p>
          </div>
        </div>
        {isRejected && (
          <Link
            href={`/payment/${result.orderNo}`}
            className="inline-flex h-11 items-center gap-2 border border-black bg-black px-4 text-[11px] font-semibold tracking-[0.12em] uppercase text-white transition-colors hover:bg-neutral-800"
          >
            <RotateCcw className="size-4" />
            Resubmit Payment Proof
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="mt-6 flex flex-col gap-1">
      {STATUS_STEPS.map((step, idx) => {
        const isDone    = idx < currentIdx
        const isCurrent = idx === currentIdx
        const isFuture  = idx > currentIdx

        return (
          <div key={step.key} className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border-2',
                  isDone    && 'border-emerald-700 bg-emerald-700 text-white',
                  isCurrent && 'border-black bg-black text-white',
                  isFuture  && 'border-neutral-300 bg-white text-neutral-400',
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="size-4" />
                ) : isCurrent ? (
                  <Circle className="size-3.5 fill-current" />
                ) : (
                  <Circle className="size-3.5" />
                )}
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 flex-1 my-1',
                    idx < currentIdx ? 'bg-emerald-600' : 'bg-neutral-200',
                  )}
                  style={{ minHeight: '20px' }}
                />
              )}
            </div>

            {/* Label */}
            <div className="pb-4 pt-0.5">
              <p
                className={cn(
                  'text-sm font-medium',
                  isDone    && 'text-emerald-800',
                  isCurrent && 'text-neutral-900',
                  isFuture  && 'text-neutral-500',
                )}
              >
                {step.label}
              </p>
              {isCurrent && (
                <p className="mt-0.5 text-xs text-neutral-500">Current status</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function OrderTrackForm({ initialOrder, initialPhone }: OrderTrackFormProps) {
  const [orderNo, setOrderNo] = useState(initialOrder ?? '')
  const [phone, setPhone]     = useState(initialPhone ?? '')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<OrderTrackResult | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    setSearched(true)

    const res = await trackOrderAction(orderNo, phone)
    setLoading(false)

    if (!res.ok) {
      setError(res.error)
      return
    }
    setResult(res.data ?? null)
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5 border-y border-neutral-900 py-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="orderNo" className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-700">Order number</Label>
          <Input
            id="orderNo"
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value.toUpperCase())}
            placeholder="ORD-20260817-0001"
            className="h-11 rounded-none border-neutral-200 font-mono focus-visible:ring-0"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone" className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-700">Phone number</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09XXXXXXXX"
            type="tel"
            className="h-11 rounded-none border-neutral-200 focus-visible:ring-0"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center border border-black bg-black text-[11px] font-semibold tracking-[0.16em] uppercase text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-300"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Tracking…
            </span>
          ) : (
            'Track Order'
          )}
        </button>
      </form>

      {/* Error */}
      {searched && !loading && error && (
        <div className="mt-4 flex items-start gap-3 border-l-2 border-red-700 bg-red-50 px-4 py-4">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="mt-8 w-full border-y border-neutral-900 py-6">
          <div className="mb-4 flex flex-col gap-0.5">
            <p className="font-mono text-lg font-bold">{result.orderNo}</p>
            <p className="text-sm text-neutral-500">
              Placed on{' '}
              {new Date(result.placedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <StatusTimeline result={result} />
          <div className="mt-4 border-t border-neutral-200 pt-4">
            <Link
              href={`/order/${result.orderNo}`}
              className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-900 hover:underline"
            >
              View order details →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
