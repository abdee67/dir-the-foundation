'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, XCircle } from 'lucide-react'

import { verifyPaymentAction, rejectPaymentAction } from '@/modules/orders/actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface PaymentApproveRejectFormProps {
  paymentId: string
  orderId: string
}

export function PaymentApproveRejectForm({ paymentId, orderId }: PaymentApproveRejectFormProps) {
  const router = useRouter()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason]       = useState('')
  const [loading, setLoading]     = useState(false)

  async function handleApprove() {
    setLoading(true)
    const result = await verifyPaymentAction(paymentId)
    setLoading(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Payment approved. Order is now Confirmed.')
    router.push(`/admin/orders/${orderId}`)
    router.refresh()
  }

  async function handleReject() {
    if (!reason.trim()) {
      toast.error('Enter a rejection reason.')
      return
    }
    setLoading(true)
    const result = await rejectPaymentAction({ paymentId, note: reason })
    setLoading(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Payment rejected.')
    router.push('/admin/payments')
    router.refresh()
  }

  if (rejecting) {
    return (
      <div className="flex flex-col gap-4 border border-destructive/40 p-4">
        <h3 className="font-medium text-destructive">Reject Payment</h3>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reason">Rejection Reason</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Incorrect amount, Invalid transaction number, Screenshot unclear…"
            rows={3}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            disabled={loading}
            onClick={handleReject}
            className="flex-1"
          >
            {loading ? 'Rejecting…' : 'Confirm Rejection'}
          </Button>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => { setRejecting(false); setReason('') }}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 border border-border p-4">
      <h3 className="font-medium">Verify Payment</h3>
      <p className="text-sm text-muted-foreground">
        Confirm the screenshot, FT number, and amount match before approving.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          disabled={loading}
          onClick={handleApprove}
          className="flex items-center gap-2"
        >
          <CheckCircle2 className="size-4" />
          Approve
        </Button>
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => setRejecting(true)}
          className="flex items-center gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
        >
          <XCircle className="size-4" />
          Reject
        </Button>
      </div>
    </div>
  )
}
