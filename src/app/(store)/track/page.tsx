import type { PageProps } from '@/lib/types'
import { OrderTrackForm } from '@/components/store/order-track-form'

export const dynamic = 'force-dynamic'

export default async function TrackOrderPage({
  searchParams,
}: PageProps<Record<string, never>, { order?: string; phone?: string }>) {
  const { order, phone } = await searchParams

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-8 px-4 py-12 sm:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-500">DIR (ድር) THE FOUNDATION</p>
        <h1 className="sf-font-display text-3xl tracking-[-0.02em] text-neutral-900 sm:text-4xl">TRACK YOUR ORDER</h1>
        <p className="max-w-sm text-sm text-neutral-600">
          Enter your order number and phone number to check your order status.
        </p>
      </div>
      <OrderTrackForm initialOrder={order} initialPhone={phone} />
    </main>
  )
}
