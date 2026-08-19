import { getSingleStoreOrg } from '@/lib/store-org'

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const org = await getSingleStoreOrg()

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-8 sm:py-20">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Customer care</p>
      <h1 className="sf-font-display mt-4 text-4xl tracking-[-0.03em] text-neutral-900 sm:text-6xl">CONTACT US</h1>
      <div className="mt-10 grid gap-8 border-t border-neutral-900 pt-8 sm:grid-cols-2">
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Get in touch</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-700">Questions about an order, sizing, or delivery? Reach out and our team will help.</p>
        </div>
        <dl className="space-y-5 text-sm">
          {org.phone && <div><dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Phone</dt><dd className="mt-1"><a className="border-b border-neutral-400 pb-0.5 hover:border-black" href={`tel:${org.phone}`}>{org.phone}</a></dd></div>}
          {org.email && <div><dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Email</dt><dd className="mt-1"><a className="border-b border-neutral-400 pb-0.5 hover:border-black" href={`mailto:${org.email}`}>{org.email}</a></dd></div>}
          {org.address && <div><dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Visit</dt><dd className="mt-1 text-neutral-700">{org.address}</dd></div>}
        </dl>
      </div>
    </main>
  )
}
