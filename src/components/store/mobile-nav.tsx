'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight } from 'lucide-react'
import type { MenuItem } from '@/types/db'
import { resolveMenuHref } from './store-links'

export function MobileNav({
  orgSlug,
  menuItems,
  storeName,
  light = false,
}: {
  orgSlug: string
  menuItems: MenuItem[]
  storeName: string
  light?: boolean
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
        className={`inline-flex size-9 items-center justify-center transition-colors lg:hidden ${light ? 'text-white hover:text-white/70' : 'text-neutral-900 hover:text-black'}`}
      >
        <Menu className="size-5" />
      </button>

      {/* Full-screen slide-in drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white text-black transition-all duration-300">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-6">
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-[0.22em] uppercase text-black">
                {storeName || 'DIR (ድር)'}
              </span>
              <span className="text-[9px] tracking-[0.18em] uppercase text-neutral-400">THE FOUNDATION</span>
            </div>
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setOpen(false)}
              className="p-2 text-neutral-700 transition-colors hover:text-black"
            >
              <X className="size-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-6 py-8">
            <ul className="flex flex-col space-y-4">
              {menuItems.map((item, index) => (
                <li key={item.href || index} className="border-b border-neutral-100 pb-3">
                  <Link
                    href={resolveMenuHref(orgSlug, item.href)}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between text-base font-medium tracking-[0.14em] uppercase text-neutral-900 transition-colors hover:text-black"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="size-4 text-neutral-300" />
                  </Link>
                </li>
              ))}
            </ul>

            {/* Utility links */}
            <div className="mt-10 pt-6 border-t border-neutral-200">
              <p className="mb-4 text-[10px] font-semibold tracking-[0.2em] uppercase text-neutral-400">Information</p>
              <div className="flex flex-col space-y-3 text-xs tracking-wider uppercase text-neutral-600">
                <Link href="/products" onClick={() => setOpen(false)} className="hover:text-black">
                  All pieces
                </Link>
                <Link href="/track" onClick={() => setOpen(false)} className="hover:text-black">
                  Track Your Order
                </Link>
              </div>
            </div>
          </nav>

          {/* Footer inside mobile menu */}
          <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-4">
            <p className="text-center text-[10px] tracking-[0.15em] uppercase text-neutral-400">DIR (ድር) THE FOUNDATION</p>
          </div>
        </div>
      )}
    </>
  )
}
