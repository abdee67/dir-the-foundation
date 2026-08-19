'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

import { useCart } from './cart-context'
import { storePath } from './store-links'

export function CartButton({ orgSlug, light = false }: { orgSlug: string; light?: boolean }) {
  const { count, mounted } = useCart()

  return (
    <Link
      href={storePath(orgSlug, '/cart')}
      aria-label={`Shopping bag (${mounted ? count : 0} items)`}
      className={`relative inline-flex size-9 items-center justify-center transition-colors ${light ? 'text-white hover:text-white/70' : 'text-neutral-900 hover:text-black'}`}
    >
      <ShoppingBag className="size-[18px] stroke-[1.75]" />
      {mounted && count > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center bg-black px-1 text-[9px] font-bold leading-none text-white">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  )
}
