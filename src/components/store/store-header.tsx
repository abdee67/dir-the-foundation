'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

import { mediaUrl } from '@/lib/media-url'
import { DEFAULT_BRAND_LOGO_URL } from '@/lib/brand'
import type { MenuItem } from '@/types/db'

import { CartButton } from './cart-button'
import type { StoreOrg } from '@/lib/store-org'
import { MobileNav } from './mobile-nav'
import { SearchOverlay } from './search-overlay'
import { resolveMenuHref } from './store-links'

type StoreCategory = { name: string; slug: string }

export function StoreHeader({
  org,
  menuItems,
  categories,
}: {
  org: Pick<StoreOrg, 'name' | 'slug' | 'logo_path'>
  menuItems: MenuItem[]
  categories: StoreCategory[]
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isRevealCheckout = pathname === '/checkout' && searchParams.get('from') === 'reveal'
  const isHome = pathname === '/'
  const lightTone = isHome && !compact
  const logoSrc = org.logo_path ? mediaUrl(org.logo_path) : DEFAULT_BRAND_LOGO_URL
  const leftQuickLink = { label: 'NEW IN', href: '/products?tags=NEW' }
  const rightQuickLink = { label: 'ALL PIECES', href: '/products' }
  const navItems = menuItems.length > 0
    ? menuItems
    : [
        { label: 'NEW IN', href: '/products?tags=NEW' },
        ...categories.map((category) => ({ label: category.name, href: `/category/${category.slug}` })),
        { label: 'SALE', href: '/products?tags=SALE' },
      ]

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (isRevealCheckout) {
    return (
      <header className="border-b border-neutral-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-8">
          <Link href="/" className="group flex flex-col items-center justify-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt={org.name} className="h-12 w-auto max-w-52 object-contain brightness-0 sm:h-14 sm:max-w-64" />
          </Link>
          <CartButton orgSlug={org.slug} />
        </div>
      </header>
    )
  }

  return (
    <>
      <header className={`sf-header sticky top-0 z-40 w-full ${isHome ? 'sf-header-home -mb-[100px] lg:-mb-[105px]' : 'border-b border-neutral-200 bg-white/95 backdrop-blur-md'} ${compact ? 'sf-header-compact' : ''}`}>
        {/* Tier 1: Main Brand Bar */}
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <MobileNav orgSlug={org.slug} menuItems={navItems} storeName={org.name} light={lightTone} />
          </div>

          <div className="hidden lg:block lg:w-40" aria-hidden />

          {/* Center Brand Identity */}
          <Link href="/" className="group flex flex-col items-center justify-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt={org.name}
              className={`h-14 w-auto max-w-52 object-contain sm:h-16 sm:max-w-64 ${lightTone ? 'brightness-0 invert' : 'brightness-0'}`}
            />
          </Link>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-2 lg:w-40">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
              className={`inline-flex size-9 items-center justify-center transition-colors ${lightTone ? 'text-white hover:text-white/70' : 'text-neutral-900 hover:text-black'}`}
            >
              <Search className="size-[18px] stroke-[1.75]" />
            </button>
            <CartButton orgSlug={org.slug} light={lightTone} />
          </div>
        </div>

        <nav className={`hidden border-t py-2.5 lg:block ${lightTone ? 'border-white/25' : 'border-neutral-100'}`} aria-label="Store navigation">
          <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-5 px-8">
            <Link
              href={leftQuickLink.href}
              className={`sf-nav-link justify-self-start text-[10px] font-semibold tracking-[0.16em] uppercase ${lightTone ? 'text-white/80 hover:text-white' : 'text-neutral-700 hover:text-black'}`}
            >
              {leftQuickLink.label}
            </Link>
            <div className="flex items-center justify-center gap-7">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={resolveMenuHref(org.slug, item.href)}
                  className={`sf-nav-link text-[11px] font-medium tracking-[0.16em] uppercase ${lightTone ? 'text-white/80 hover:text-white' : 'text-neutral-700 hover:text-black'}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <Link
              href={rightQuickLink.href}
              className={`sf-nav-link justify-self-end text-[10px] font-semibold tracking-[0.16em] uppercase ${lightTone ? 'text-white/80 hover:text-white' : 'text-neutral-700 hover:text-black'}`}
            >
              {rightQuickLink.label}
            </Link>
          </div>
        </nav>

        <nav className={`grid grid-cols-2 divide-x border-t lg:hidden ${lightTone ? 'divide-white/25 border-white/25' : 'divide-neutral-200 border-neutral-100'}`} aria-label="Quick shopping links">
          <Link
            href={leftQuickLink.href}
            className={`flex h-9 items-center justify-center px-3 text-[10px] font-semibold tracking-[0.14em] uppercase transition-colors ${lightTone ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-neutral-700 hover:bg-neutral-50 hover:text-black'}`}
          >
            {leftQuickLink.label}
          </Link>
          <Link
            href={rightQuickLink.href}
            className={`flex h-9 items-center justify-center px-3 text-[10px] font-semibold tracking-[0.14em] uppercase transition-colors ${lightTone ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-neutral-700 hover:bg-neutral-50 hover:text-black'}`}
          >
            {rightQuickLink.label}
          </Link>
        </nav>
      </header>

      {/* Full-width Search Overlay */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        discoveryLinks={navItems}
      />
    </>
  )
}
