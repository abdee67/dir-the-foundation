import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { getOrgSettings, settingStr } from '@/lib/settings'
import { DEFAULT_BRAND_LOGO_URL } from '@/lib/brand'
import { env } from '@/lib/env'
import { getSingleStoreOrg } from '@/lib/store-org'
import { getAnonClient } from '@/lib/supabase/anon'
import type { Category, Menu } from '@/types/db'

import { AnnouncementBar } from '@/components/store/announcement-bar'
import { CartProvider } from '@/components/store/cart-context'
import { StoreFooter } from '@/components/store/store-footer'
import { StoreHeader } from '@/components/store/store-header'
import { WhatsappFloat } from '@/components/store/whatsapp-float'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const org = await getSingleStoreOrg()
  return {
    title: { default: org.name, template: `%s · ${org.name}` },
    description: `Shop ${org.name} online.`,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'en_ET',
      siteName: org.name,
      title: org.name,
      description: `Shop ${org.name} online.`,
      images: [{ url: DEFAULT_BRAND_LOGO_URL, width: 512, height: 512, alt: `${org.name} logo` }],
    },
    twitter: {
      card: 'summary',
      title: org.name,
      description: `Shop ${org.name} online.`,
      images: [DEFAULT_BRAND_LOGO_URL],
    },
  }
}

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const org = await getSingleStoreOrg()
  const settings = await getOrgSettings(org.id)

  const supabase = getAnonClient()
  const [{ data: menuRows }, { data: categoryRows }] = await Promise.all([
    supabase
      .from('menus')
      .select('handle, items')
      .eq('org_id', org.id)
      .in('handle', ['header', 'footer']),
    supabase
      .from('categories')
      .select('name, slug')
      .eq('org_id', org.id)
      .order('sort_order', { ascending: true }),
  ])

  const menus = (menuRows ?? []) as Pick<Menu, 'handle' | 'items'>[]
  const headerItems = menus.find((m) => m.handle === 'header')?.items ?? []
  const footerItems = menus.find((m) => m.handle === 'footer')?.items ?? []
  const categories = (categoryRows ?? []) as Pick<Category, 'name' | 'slug'>[]

  const announcement = settingStr(settings, 'storefront.announcement')
  const whatsappNumber = settingStr(settings, 'storefront.whatsapp_number')
  const primaryColor = settingStr(settings, 'storefront.primary_color')
  const siteUrl = env.APP_URL.replace(/\/$/, '')
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    '@id': siteUrl,
    name: org.name,
    url: siteUrl,
    logo: `${siteUrl}${DEFAULT_BRAND_LOGO_URL}`,
    image: `${siteUrl}${DEFAULT_BRAND_LOGO_URL}`,
    email: org.email || undefined,
    telephone: org.phone || undefined,
    address: org.address || undefined,
  }

  return (
    <CartProvider orgSlug={org.slug}>
      <div
        className="storefront flex min-h-dvh flex-col"
        style={primaryColor ? ({ '--primary': primaryColor } as CSSProperties) : undefined}
      >
        <AnnouncementBar text={announcement} />
        <StoreHeader org={org} menuItems={headerItems} categories={categories} />
        <main className="flex-1">{children}</main>
        <StoreFooter org={org} menuItems={footerItems} categories={categories} />
        <WhatsappFloat number={whatsappNumber} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      </div>
    </CartProvider>
  )
}
