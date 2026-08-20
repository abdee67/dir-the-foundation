'use client'

import Link from 'next/link'

import type { MenuItem } from '@/types/db'
import { mediaUrl } from '@/lib/media-url'
import { DEFAULT_BRAND_LOGO_URL } from '@/lib/brand'
import type { StoreOrg } from '@/lib/store-org'
import { resolveMenuHref } from './store-links'

type StoreCategory = { name: string; slug: string }

export function StoreFooter({
  org,
  menuItems,
  categories,
}: {
  org: Pick<StoreOrg, 'name' | 'slug' | 'logo_path' | 'phone' | 'email' | 'address'>
  menuItems: MenuItem[]
  categories: StoreCategory[]
}) {
  const logoSrc = org.logo_path ? mediaUrl(org.logo_path) : DEFAULT_BRAND_LOGO_URL

  return (
    <footer className="border-t border-neutral-800 bg-[#101010] text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.3fr_1fr_1fr] lg:gap-16 lg:py-20">
        <div>
          <Link href="/" className="inline-flex flex-col" aria-label={`${org.name} home`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt={org.name} className={`h-14 w-auto max-w-56 object-contain object-left sm:h-16 sm:max-w-64 ${org.logo_path ? '' : 'brightness-0 invert'}`} />
          </Link>
          <p className="mt-6 max-w-xs text-sm leading-6 text-neutral-400">
            New arrivals, considered essentials, and updates from DIR (ድር) THE FOUNDATION.
          </p>
          {(org.email || org.phone || org.address) && (
            <div className="mt-6 space-y-1 text-xs leading-5 text-neutral-400">
              {org.address && <p>{org.address}</p>}
              {org.email && <a href={`mailto:${org.email}`} className="block hover:text-white">{org.email}</a>}
              {org.phone && <a href={`tel:${org.phone}`} className="block hover:text-white">{org.phone}</a>}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-300">Shop</h2>
          <ul className="mt-5 space-y-3 text-sm text-neutral-400">
            <li><Link href="/products" className="hover:text-white">All pieces</Link></li>
            <li><Link href="/products?tags=NEW" className="hover:text-white">New in</Link></li>
            <li><Link href="/products?tags=SALE" className="hover:text-white">Sale</Link></li>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link href={`/category/${category.slug}`} className="hover:text-white">{category.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-300">Help</h2>
          <ul className="mt-5 space-y-3 text-sm text-neutral-400">
            <li><Link href="/track" className="hover:text-white">Track an order</Link></li>
            {org.email && <li><a href={`mailto:${org.email}`} className="hover:text-white">Contact DIR</a></li>}
            {menuItems.map((item) => (
              <li key={`${item.label}-${item.href}`}>
                <Link href={resolveMenuHref(org.slug, item.href)} className="hover:text-white">{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-800 px-4 py-5 text-center text-[10px] tracking-[0.14em] uppercase text-neutral-500 sm:px-8">
        © {new Date().getFullYear()} DIR (ድር) THE FOUNDATION. All rights reserved.
      </div>
    </footer>
  )
}
