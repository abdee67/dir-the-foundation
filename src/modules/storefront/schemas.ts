import { z } from 'zod'

// Storefront zod schemas (docs/conventions.md — Server actions: "Validate with zod schema
// from src/modules/<key>/schemas.ts"). Consumed by src/modules/storefront/actions.ts and by
// client forms (react-hook-form + zodResolver) in src/components/store/**.

/** BD mobile: 10 digits, 09[3-9]XXXXXXXX. */
export const BD_PHONE_REGEX = /^09\d{8}$/

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined))

const optionalEmail = z
  .string()
  .trim()
  .email('Enter a valid email')
  .optional()
  .or(z.literal(''))
  .transform((v) => (v ? v : undefined))

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120),
  phone: z
    .string()
    .trim()
    .regex(BD_PHONE_REGEX, 'Enter a valid 10-digit phone number (09XXXXXXXX)'),
  email: optionalEmail,
})

export const addressSchema = z.object({
  line1: z.string().trim().min(3, 'Address is required').max(300),
  area: optionalTrimmed(150),
  district: z.string().trim().min(2, 'Select a district'),
})

export const cartItemInputSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  qty: z.number().int().positive().max(999),
  reveal: z.object({
    dropId: z.string().uuid(),
    purchaseType: z.enum(['buy_now', 'pre_order']),
    fit: z.string().trim().max(40).nullable(),
    color: z.string().trim().max(40).nullable(),
    size: z.string().trim().max(40).nullable(),
    customizationText: z.string().trim().max(10).nullable(),
  }).optional(),
})
export type CartItemInput = z.infer<typeof cartItemInputSchema>

export const quoteDeliverySchema = z.object({
  orgSlug: z.string().min(1),
  district: z.string().trim().min(1, 'Select a district'),
})
export type QuoteDeliveryInput = z.infer<typeof quoteDeliverySchema>

export const placeOrderSchema = z.object({
  orgSlug: z.string().min(1),
  contact: contactSchema,
  address: addressSchema,
  items: z.array(cartItemInputSchema).min(1, 'Your cart is empty'),
  noteCustomer: optionalTrimmed(500),
  // Legacy fields — kept optional so old callers don't break
  discountCode: optionalTrimmed(64),
  paymentMethod: z.string().optional(),
  advanceMfsProvider: z.enum(['bkash', 'nagad']).optional(),
  trxId: optionalTrimmed(64),
  senderNumber: optionalTrimmed(20),
})
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>
