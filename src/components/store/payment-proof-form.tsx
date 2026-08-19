'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { formatMoney } from '@/lib/money'
import { submitPaymentProofAction } from '@/modules/storefront/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PaymentMethodConfig {
  name: string
  type: 'mobile_wallet' | 'bank'
  account_number?: string
  account_name: string
  phone?: string
}

interface PaymentProofFormProps {
  orderId: string
  orderNo: string
  orderTotal: number
  paymentMethods: PaymentMethodConfig[]
  orgId: string
}

const MAX_SIZE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function PaymentProofForm({
  orderId,
  orderNo,
  orderTotal,
  paymentMethods,
  orgId,
}: PaymentProofFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedMethod, setSelectedMethod] = useState(paymentMethods[0]?.name ?? '')
  const [transactionNumber, setTransactionNumber] = useState('')
  const [amount, setAmount] = useState(String(orderTotal / 100)) // display in taka
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFileError(null)
    if (!f) { setFile(null); setPreview(null); return }

    if (!ALLOWED_TYPES.includes(f.type)) {
      setFileError('Only JPG, PNG, WEBP, or GIF images are accepted.')
      return
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`Screenshot must be smaller than ${MAX_SIZE_MB}MB.`)
      return
    }

    setFile(f)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { toast.error('Please upload your payment screenshot.'); return }
    if (!transactionNumber.trim()) { toast.error('Enter your transaction / FT reference number.'); return }
    if (!selectedMethod) { toast.error('Select the payment method you used.'); return }

    const amountTaka = parseFloat(amount)
    if (isNaN(amountTaka) || amountTaka <= 0) { toast.error('Enter a valid amount.'); return }
    const amountPaisa = Math.round(amountTaka * 100)

    // Read file as base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (ev) => resolve(ev.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    setSubmitting(true)
    const result = await submitPaymentProofAction({
      orderId,
      orgId,
      paymentMethod: selectedMethod,
      transactionNumber: transactionNumber.trim(),
      amount: amountPaisa,
      screenshotBase64: base64,
      screenshotMimeType: file.type,
      screenshotFileName: file.name,
    })
    setSubmitting(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    toast.success('Payment proof submitted! Your order is now under review.')
    router.push(`/track?order=${orderNo}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      {/* Payment method */}
      {paymentMethods.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-700">Payment method used</Label>
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((m) => (
              <button
                key={m.name}
                type="button"
                onClick={() => setSelectedMethod(m.name)}
                className={`border px-4 py-2.5 text-xs font-medium tracking-[0.08em] uppercase transition-colors ${
                  selectedMethod === m.name
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-200 bg-white text-neutral-800 hover:border-black'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {paymentMethods.length === 0 && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="paymentMethod" className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-700">Payment method used</Label>
          <Input
            id="paymentMethod"
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            placeholder="e.g. Telebirr, CBE Bank"
            className="h-11 rounded-none border-neutral-200 text-sm focus-visible:ring-0"
            required
          />
        </div>
      )}

      {/* Amount paid */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount" className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-700">
          Amount paid{' '}
          <span className="normal-case text-xs font-normal tracking-normal text-neutral-500">(Order total: {formatMoney(orderTotal)})</span>
        </Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount you paid"
          required
          className="h-11 rounded-none border-neutral-200 text-sm focus-visible:ring-0"
        />
      </div>

      {/* Transaction number */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="txnNo" className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-700">Transaction / FT reference</Label>
        <Input
          id="txnNo"
          value={transactionNumber}
          onChange={(e) => setTransactionNumber(e.target.value)}
          placeholder="e.g. FT1234567890"
          required
          className="h-11 rounded-none border-neutral-200 text-sm focus-visible:ring-0"
        />
        <p className="text-xs text-neutral-500">
          The reference number shown in your payment receipt or SMS.
        </p>
      </div>

      {/* Screenshot upload */}
      <div className="flex flex-col gap-2">
        <Label className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-700">Payment screenshot</Label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed p-6 transition-colors ${
            file
              ? 'border-emerald-700 bg-emerald-50'
              : 'border-neutral-300 bg-white hover:border-black'
          }`}
        >
          {preview ? (
            <div className="relative w-full max-w-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Payment screenshot preview"
                className="w-full object-contain"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                  setPreview(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="absolute -right-2 -top-2 flex size-6 items-center justify-center bg-black text-white"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="size-8 text-neutral-500" />
              <div className="text-center">
                <p className="text-sm font-medium">Click to upload screenshot</p>
                <p className="text-xs text-neutral-500">JPG, PNG, WEBP, GIF · max {MAX_SIZE_MB}MB</p>
              </div>
            </>
          )}
          {file && !preview && (
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="size-4" />
              {file.name}
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          className="sr-only"
          onChange={handleFileChange}
        />
        {fileError && <p className="text-xs text-destructive">{fileError}</p>}
      </div>

      <button
        type="submit"
        disabled={submitting || !file}
        className="flex h-12 w-full items-center justify-center border border-black bg-black text-[11px] font-semibold tracking-[0.16em] uppercase text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-300"
      >
        {submitting ? 'Submitting…' : 'Submit Payment Proof'}
      </button>

      <p className="text-center text-xs text-neutral-500">
        Your order will be confirmed after our team reviews your payment.
      </p>
    </form>
  )
}
