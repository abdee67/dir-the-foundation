import { Mail, MapPin, Phone } from 'lucide-react'

import type { ContactBlock } from '@/types/db'

import type { BlockRenderContext } from './render-blocks'

// ContactForm removed in clothing-store build (inquiries table removed).
// The contact block still renders org contact info — just not the inquiry form.

export function ContactBlockView({ block, ctx }: { block: ContactBlock; ctx: BlockRenderContext }) {
  return (
    <section className="mx-auto grid max-w-4xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2">
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{block.heading}</h2>
        {ctx.org.phone ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="size-4" /> {ctx.org.phone}
          </p>
        ) : null}
        {ctx.org.email ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4" /> {ctx.org.email}
          </p>
        ) : null}
        {ctx.org.address ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" /> {ctx.org.address}
          </p>
        ) : null}
      </div>
      {/* Inquiry form disabled — contact us via phone/email above */}
    </section>
  )
}
