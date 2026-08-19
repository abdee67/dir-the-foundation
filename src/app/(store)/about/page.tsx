import { getSingleStoreOrg } from '@/lib/store-org'

export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const org = await getSingleStoreOrg()

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-8 sm:py-20">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">DIR (ድር) THE FOUNDATION</p>
      <h1 className="sf-font-display mt-4 text-4xl tracking-[-0.03em] text-neutral-900 sm:text-6xl">ABOUT US</h1>
      <div className="mt-10 max-w-2xl space-y-6 border-t border-neutral-900 pt-8 text-base leading-8 text-neutral-700">
        <p>{org.name} is a considered clothing store for pieces that feel modern, wearable, and lasting.</p>
        <p>We curate everyday essentials and thoughtful statement pieces with a focus on fabric, fit, and the details that make getting dressed feel easy.</p>
      </div>
    </main>
  )
}
