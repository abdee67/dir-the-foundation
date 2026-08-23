import { z } from 'zod'

export const DROP_STATUS_VALUES = ['draft', 'scheduled', 'completed', 'archived'] as const
export const DROP_PHASE_VALUES = ['teaser', 'reveal', 'store'] as const

const optionalIsoDate = z.string().datetime({ offset: true }).nullable()

export const dropInputSchema = z
  .object({
    drop_number: z.string().trim().min(3, 'Drop number is required').max(40).regex(/^[A-Za-z0-9][A-Za-z0-9 -]*$/, 'Use letters, numbers, spaces, or hyphens only'),
    name: z.string().trim().min(2, 'Drop name is required').max(160),
    description: z.string().trim().max(1000).nullable(),
    launch_message: z.string().trim().min(1, 'Add the SMS launch message.').max(480).nullable(),
    status: z.enum(DROP_STATUS_VALUES),
    teaser_hero_media_id: z.string().uuid().nullable(),
    teaser_starts_at: optionalIsoDate,
    teaser_ends_at: optionalIsoDate,
    reveal_product_id: z.string().uuid().nullable(),
    mens_campaign_media_id: z.string().uuid().nullable(),
    womens_campaign_media_id: z.string().uuid().nullable(),
    store_starts_at: optionalIsoDate,
    automatic_transitions_enabled: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const start = data.teaser_starts_at ? new Date(data.teaser_starts_at) : null
    const end = data.teaser_ends_at ? new Date(data.teaser_ends_at) : null
    const store = data.store_starts_at ? new Date(data.store_starts_at) : null
    if (start && end && end <= start) ctx.addIssue({ code: 'custom', path: ['teaser_ends_at'], message: 'Teaser end must be after its start.' })
    if (end && store && store <= end) ctx.addIssue({ code: 'custom', path: ['store_starts_at'], message: 'Store launch must be after the reveal begins.' })
  })

export type DropInput = z.infer<typeof dropInputSchema>

export const dropPhaseSchema = z.object({ phase: z.enum(DROP_PHASE_VALUES) })
export type DropPhaseInput = z.infer<typeof dropPhaseSchema>
