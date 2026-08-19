'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X, ArrowRight } from 'lucide-react'
import type { MenuItem } from '@/types/db'

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
  discoveryLinks: MenuItem[]
}

export function SearchOverlay({ isOpen, onClose, discoveryLinks }: SearchOverlayProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const query = new FormData(form).get('q')?.toString().trim()
    if (query) {
      onClose()
      router.push(`/products?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white/98 backdrop-blur-md transition-all duration-300">
      {/* Header with Close */}
      <div className="border-b border-neutral-200">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-6">
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-neutral-400">
            Search Store
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="flex items-center gap-2 text-xs font-medium tracking-[0.14em] uppercase text-neutral-800 transition-colors hover:text-black"
          >
            <span>Close</span>
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Main Search Input Form */}
      <div className="mx-auto w-full max-w-4xl px-6 pt-12 pb-8">
        <form onSubmit={handleSubmit} className="relative border-b-2 border-black pb-4">
          <div className="flex items-center gap-4">
            <Search className="size-6 text-neutral-400" />
            <input
              ref={inputRef}
              type="search"
              name="q"
              placeholder="Type what you're looking for..."
              className="w-full bg-transparent text-xl font-normal text-black placeholder:text-neutral-300 focus:outline-none sm:text-3xl"
            />
            <button
              type="submit"
              aria-label="Submit search"
              className="hidden items-center gap-1.5 text-xs font-semibold tracking-[0.16em] uppercase text-black hover:opacity-70 sm:inline-flex"
            >
              <span>Search</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </form>

        {/* Quick Discovery Links */}
        <div className="mt-12">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-neutral-400">
            Discover DIR
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {[...discoveryLinks, { label: 'ALL PIECES', href: '/products' }].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-medium tracking-[0.06em] text-neutral-700 transition-all hover:border-black hover:bg-black hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
