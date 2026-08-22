import Link from 'next/link'

import { t, type Lang } from '@/lib/i18n'
import { getOrgSettings, settingStr } from '@/lib/settings'
import { getSingleStoreOrg } from '@/lib/store-org'
import { getAdminClient } from '@/lib/supabase/admin'

import { GuestCheckoutForm, type GuestCheckoutSettings } from '@/components/store/guest-checkout-form'
import type { PageProps } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage({ searchParams }: PageProps<Record<string, never>, { from?: string }>) {
  const { from } = await searchParams
  const isRevealFlow = from === 'reveal'
  const org = await getSingleStoreOrg()
  const settings = await getOrgSettings(org.id)
  const lang = settingStr(settings, 'localization.language') as Lang
  const { data: deliveryZones } = await getAdminClient()
    .from('delivery_zones')
    .select('name, districts')
    .eq('org_id', org.id)
    .eq('is_active', true)
    .order('position', { ascending: true })

  const deliveryAreas = ((deliveryZones ?? []) as { name: string; districts: string[] }[])
    .filter((zone) => zone.districts.length > 0)
    .map((zone) => ({ label: zone.name, locations: zone.districts }))

  const checkoutSettings: GuestCheckoutSettings = {
    orgSlug: org.slug,
    lang,
    deliveryAreas,
  }

  return (
    <div className="mx-auto max-w-[1360px] px-4 py-10 sm:px-8 lg:py-14">
      <div className="mb-10 flex items-end justify-between gap-6 border-b border-neutral-900 pb-6 sm:mb-12">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-500">DIR (ድር) THE FOUNDATION</p>
          <h1 className="sf-font-display mt-2 text-3xl tracking-[-0.02em] text-neutral-900 sm:text-5xl">{t('checkout', lang).toUpperCase()}</h1>
        </div>
        <Link href={isRevealFlow ? '/cart?from=reveal' : '/cart'} className="hidden border-b border-neutral-400 pb-1 text-[10px] font-semibold tracking-[0.14em] uppercase text-neutral-600 transition-colors hover:border-black hover:text-black sm:inline-flex">
          Return to bag
        </Link>
      </div>
      <GuestCheckoutForm settings={checkoutSettings} />
    </div>
  )
}
