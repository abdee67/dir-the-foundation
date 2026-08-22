'use client'

import { MessageCircle } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'

import { whatsappHref } from './store-links'

/** settings.storefront.whatsapp_number — fixed bottom-right float button. Renders nothing when unset. */
export function WhatsappFloat({ number }: { number: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const href = number ? whatsappHref(number) : null
  if (!href || (pathname === '/checkout' && searchParams.get('from') === 'reveal')) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed right-4 bottom-4 z-40 flex size-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs transition-transform hover:scale-105 sm:right-6 sm:bottom-6"
    >
      <MessageCircle className="size-6" />
    </a>
  )
}
