import Link from 'next/link'
import { getOrgSettings, settingStr } from '@/lib/settings'
import { getSingleStoreOrg } from '@/lib/store-org'
import { type Lang } from '@/lib/i18n'

import { CartView } from '@/components/store/cart-view'

export const dynamic = 'force-dynamic'

export default async function CartPage() {
  const org = await getSingleStoreOrg()
  const settings = await getOrgSettings(org.id)
  const lang = settingStr(settings, 'localization.language') as Lang

  return (
    <div className="mx-auto max-w-[1360px] px-4 py-10 sm:px-8 lg:py-14">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase text-neutral-400">
        <Link href="/" className="hover:text-black">
          Home
        </Link>
        <span>/</span>
        <span className="text-neutral-900">Shopping Bag</span>
      </nav>

      {/* Editorial Title */}
      <div className="mb-10 border-b border-neutral-200 pb-6">
        <h1 className="sf-font-display text-3xl font-normal tracking-tight text-neutral-900 sm:text-5xl">
          YOUR SHOPPING BAG
        </h1>
        <p className="mt-2 text-xs text-neutral-500">
          Review your selected DIR (ድር) pieces before continuing to checkout.
        </p>
      </div>

      <CartView orgSlug={org.slug} lang={lang} />
    </div>
  )
}
