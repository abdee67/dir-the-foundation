'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { type Lang } from '@/lib/i18n'
import { formatMoney } from '@/lib/money'
import { placeOrderAction, quoteDeliveryAction, type DeliveryQuote } from '@/modules/storefront/actions'
import { type PlaceOrderInput } from '@/modules/storefront/schemas'

import { useCart } from './cart-context'

export interface GuestCheckoutSettings {
  orgSlug: string
  lang: Lang
  deliveryAreas: { label: string; locations: string[] }[]
}

const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/
const fieldClassName = 'h-12 rounded-none border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-none placeholder:text-neutral-400 focus-visible:border-black focus-visible:ring-0'
const textareaClassName = 'min-h-28 rounded-none border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 shadow-none placeholder:text-neutral-400 focus-visible:border-black focus-visible:ring-0'
const labelClassName = 'text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-700'

const guestCheckoutSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120),
  phone: z.string().trim().regex(PHONE_REGEX, 'Enter a valid phone number'),
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')).transform((value) => (value ? value : undefined)),
  line1: z.string().trim().min(3, 'Address is required').max(300),
  area: z.string().trim().max(150).optional().or(z.literal('')).transform((value) => (value ? value : undefined)),
  district: z.string().trim().min(2, 'Select your delivery area'),
  noteCustomer: z.string().trim().max(500).optional().or(z.literal('')).transform((value) => (value ? value : undefined)),
})

type GuestCheckoutValues = z.infer<typeof guestCheckoutSchema>

function CheckoutSection({
  number,
  title,
  description,
  children,
}: {
  number: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="border-t border-neutral-900 py-7 sm:py-8">
      <div className="grid gap-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-8">
        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-500">{number}</p>
        <div>
          <h2 className="text-sm font-semibold tracking-[0.1em] uppercase text-neutral-900">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">{description}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </section>
  )
}

export function GuestCheckoutForm({ settings }: { settings: GuestCheckoutSettings }) {
  const { orgSlug } = settings
  const router = useRouter()
  const { items, subtotal, mounted, clear } = useCart()
  const [zoneQuote, setZoneQuote] = useState<DeliveryQuote | null>(null)
  const [zoneLoading, setZoneLoading] = useState(false)

  const form = useForm<GuestCheckoutValues>({
    resolver: zodResolver(guestCheckoutSchema),
    defaultValues: { name: '', phone: '', email: '', line1: '', area: '', district: '', noteCustomer: '' },
  })

  async function fetchZoneQuote(district: string) {
    setZoneLoading(true)
    const result = await quoteDeliveryAction({ orgSlug, district })
    setZoneLoading(false)
    setZoneQuote(result.ok ? (result.data ?? null) : null)
  }

  const deliveryCharge = zoneQuote?.charge ?? 0
  const total = subtotal + deliveryCharge

  async function onSubmit(values: GuestCheckoutValues) {
    if (items.length === 0) return

    const payload: PlaceOrderInput = {
      orgSlug,
      contact: { name: values.name, phone: values.phone, email: values.email },
      address: { line1: values.line1, area: values.area, district: values.district },
      items: items.map((item) => ({ productId: item.productId, variantId: item.variantId ?? null, qty: item.qty })),
      noteCustomer: values.noteCustomer,
    }

    const result = await placeOrderAction(payload)
    if (!result.ok || !result.data) {
      toast.error(result.ok ? 'Something went wrong. Please try again.' : result.error)
      return
    }

    clear()
    router.push(`/order/${result.data.orderNo}`)
  }

  if (!mounted) return <div className="h-96" aria-hidden />

  if (items.length === 0) {
    return (
      <div className="border-y border-neutral-900 py-16 text-center">
        <p className="text-sm text-neutral-600">Your bag is empty.</p>
        <Link href="/products" className="sf-btn sf-btn-primary mt-6">Explore the collection</Link>
      </div>
    )
  }

  const deliveryLabel = zoneLoading
    ? 'Calculating'
    : !zoneQuote
      ? 'At checkout'
      : deliveryCharge === 0
        ? 'No delivery charge'
        : formatMoney(deliveryCharge)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] lg:items-start lg:gap-x-16 xl:gap-x-24">
        <div className="min-w-0">
          <CheckoutSection number="01" title="Contact" description="Use details we can use to confirm your order.">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className={labelClassName}>Full name</FormLabel>
                    <FormControl><Input {...field} placeholder="Your full name" className={fieldClassName} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClassName}>Phone number</FormLabel>
                    <FormControl><Input {...field} type="tel" placeholder="09XXXXXXXX" className={fieldClassName} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClassName}>Email <span className="normal-case font-normal tracking-normal text-neutral-400">(optional)</span></FormLabel>
                    <FormControl><Input {...field} type="email" placeholder="you@example.com" className={fieldClassName} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CheckoutSection>

          <CheckoutSection number="02" title="Delivery" description="Enter your address to calculate the delivery cost for your area.">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="line1"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className={labelClassName}>Street address</FormLabel>
                    <FormControl><Input {...field} placeholder="House, road, neighbourhood" className={fieldClassName} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClassName}>Area <span className="normal-case font-normal tracking-normal text-neutral-400">(optional)</span></FormLabel>
                    <FormControl><Input {...field} placeholder="Area / neighbourhood" className={fieldClassName} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClassName}>Delivery area</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className={fieldClassName}
                        onChange={(event) => {
                          field.onChange(event)
                          field.onBlur()
                          if (event.target.value.trim()) void fetchZoneQuote(event.target.value)
                        }}
                      >
                        <option value="">Select your area</option>
                        {settings.deliveryAreas.map((group) => (
                          <optgroup key={group.label} label={group.label}>
                            {group.locations.map((location) => <option key={location} value={location}>{location}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="noteCustomer"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className={labelClassName}>Delivery note <span className="normal-case font-normal tracking-normal text-neutral-400">(optional)</span></FormLabel>
                    <FormControl><Textarea {...field} rows={3} placeholder="Building, landmark, or another helpful instruction" className={textareaClassName} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CheckoutSection>
        </div>

        <aside className="w-full lg:sticky lg:top-28">
          <div className="border border-neutral-900 bg-[#f5f4f2] p-5 sm:p-6">
            <div className="flex items-end justify-between border-b border-neutral-900 pb-5">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-500">Your order</p>
                <h2 className="sf-font-display mt-1 text-2xl text-neutral-900">THE BAG</h2>
              </div>
              <span className="text-[10px] tracking-[0.14em] uppercase text-neutral-500">
                {items.length} {items.length === 1 ? 'piece' : 'pieces'}
              </span>
            </div>

            <ul className="divide-y divide-neutral-300 py-3">
              {items.map((item) => (
                <li key={`${item.productId}-${item.variantId ?? ''}`} className="flex items-start justify-between gap-4 py-3 text-xs">
                  <span className="min-w-0 leading-5 text-neutral-700">
                    <span className="block truncate font-medium tracking-[0.03em] text-neutral-900">{item.name}</span>
                    <span className="text-neutral-500">
                      {item.variantName ? `${item.variantName} · ` : ''}Qty {item.qty}
                    </span>
                  </span>
                  <span className="shrink-0 pt-0.5 font-medium tabular-nums text-neutral-900">{formatMoney(item.unitPrice * item.qty)}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t border-neutral-300 py-5 text-sm">
              <div className="flex items-center justify-between gap-4 text-neutral-600">
                <span>Subtotal</span>
                <span className="font-medium tabular-nums text-neutral-900">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex items-start justify-between gap-4 text-neutral-600">
                <span>Delivery</span>
                <span className="max-w-36 text-right text-xs leading-4 text-neutral-500">{deliveryLabel}</span>
              </div>
              {zoneQuote?.etaText && <p className="text-xs leading-5 text-neutral-500">{zoneQuote.etaText}</p>}
              {zoneQuote?.warning && <p className="border-l-2 border-amber-700 pl-3 text-xs leading-5 text-amber-900">{zoneQuote.warning}</p>}
            </div>

            <div className="flex items-baseline justify-between border-t border-neutral-900 pt-5">
              <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-900">Total</span>
              <span className="text-2xl font-semibold tabular-nums text-neutral-900">{formatMoney(total)}</span>
            </div>

            <div className="mt-6 border-l-2 border-black pl-3 text-xs leading-5 text-neutral-600">
              <p className="font-medium text-neutral-900">Payment after order placement</p>
              <p className="mt-1">Payment instructions are shown once your order has been placed.</p>
            </div>

            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="mt-7 flex h-12 w-full items-center justify-center border border-black bg-black px-4 text-[11px] font-semibold tracking-[0.18em] uppercase text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-300"
            >
              {form.formState.isSubmitting ? 'Placing order…' : 'Place order'}
            </button>
          </div>

          <Link href="/cart" className="mt-4 inline-flex border-b border-neutral-400 pb-1 text-[10px] font-semibold tracking-[0.14em] uppercase text-neutral-600 transition-colors hover:border-black hover:text-black">
            Return to bag
          </Link>
        </aside>
      </form>
    </Form>
  )
}
