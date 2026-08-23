import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Eye, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { requireOrg } from '@/lib/auth'
import { requireModule } from '@/lib/modules'
import { mediaUrl } from '@/lib/media-url'
import { getServerClient } from '@/lib/supabase/server'
import type { PageProps } from '@/lib/types'
import type { Drop, DropPhase, Product } from '@/types/db'

export const dynamic = 'force-dynamic'

const phases: DropPhase[] = ['teaser', 'reveal', 'store']

export default async function DropPreviewPage({ params, searchParams }: PageProps<{ id: string }, { phase?: string }>) {
  const { id } = await params
  const requestedPhase = (await searchParams).phase
  const ctx = await requireOrg()
  requireModule(ctx.org, 'drops')
  const supabase = await getServerClient()
  const { data } = await supabase.from('drops').select('*').eq('id', id).eq('org_id', ctx.org.id).single()
  if (!data) notFound()
  const drop = data as Drop
  const phase = phases.includes(requestedPhase as DropPhase) ? requestedPhase as DropPhase : drop.current_phase
  const mediaIds = [drop.teaser_hero_media_id, drop.mens_campaign_media_id, drop.womens_campaign_media_id].filter((value): value is string => Boolean(value))
  const [{ data: mediaRows }, productResult] = await Promise.all([
    mediaIds.length > 0 ? supabase.from('media').select('id, path').in('id', mediaIds) : Promise.resolve({ data: [] as { id: string; path: string }[] }),
    drop.reveal_product_id ? supabase.from('products').select('id, name, price').eq('id', drop.reveal_product_id).single() : Promise.resolve({ data: null }),
  ])
  const images = new Map((mediaRows ?? []).map((row) => [row.id, mediaUrl(row.path)]))
  const product = productResult.data as Pick<Product, 'id' | 'name' | 'price'> | null

  return (
    <main className="min-h-svh bg-black text-white">
      <div className="fixed inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/20 bg-black/70 px-4 py-3 backdrop-blur sm:px-6"><span className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] uppercase text-white/70"><Eye className="size-3.5" />Preview mode · no production changes</span><Button asChild variant="outline" size="sm" className="border-white/30 bg-transparent text-white hover:bg-white hover:text-black"><Link href={`/admin/drops/${drop.id}`}>Return to control room</Link></Button></div>
      {phase === 'teaser' && <section className="relative grid min-h-svh place-items-center overflow-hidden"><div className="absolute inset-0 bg-neutral-900">{drop.teaser_hero_media_id && images.get(drop.teaser_hero_media_id) ? <img src={images.get(drop.teaser_hero_media_id)} alt="" className="size-full object-cover opacity-65" /> : null}</div><div className="relative z-1 text-center"><p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-white/70">Preview · Teaser</p><h1 className="sf-font-display mt-6 text-5xl tracking-[-0.05em] sm:text-7xl">DIR <span lang="am">(ድር)</span></h1><p className="mt-4 text-sm tracking-[0.18em] uppercase">The Foundation</p><p className="mt-16 text-xs tracking-[0.2em] uppercase text-white/80">Something is being built.</p><span className="mt-8 inline-flex border border-white/60 px-5 py-3 text-[10px] font-semibold tracking-[0.16em] uppercase">Notify me</span></div></section>}
      {phase === 'reveal' && <section className="grid min-h-svh grid-cols-1 pt-12 sm:grid-cols-2"><CampaignView label="Men's campaign" image={drop.mens_campaign_media_id ? images.get(drop.mens_campaign_media_id) : undefined} product={product} /><CampaignView label="Women's campaign" image={drop.womens_campaign_media_id ? images.get(drop.womens_campaign_media_id) : undefined} product={product} /></section>}
      {phase === 'store' && <section className="grid min-h-svh place-items-center px-5 pt-12 text-center"><div><p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/60">Preview · Store</p><h1 className="sf-font-display mt-4 text-5xl">NORMAL STORE</h1><p className="mt-4 max-w-md text-sm leading-6 text-white/70">This phase returns customers to the standard storefront. This preview does not change the active experience.</p><span className="mt-8 inline-flex items-center gap-2 text-xs text-white/70"><ShieldCheck className="size-4" />Safe preview</span></div></section>}
    </main>
  )
}

function CampaignView({ label, image, product }: { label: string; image?: string; product: Pick<Product, 'id' | 'name' | 'price'> | null }) {
  return <div className="relative isolate grid min-h-[50svh] place-items-end overflow-hidden bg-neutral-900 p-6 sm:min-h-[calc(100svh-3rem)] sm:p-10">{image ? <img src={image} alt="" className="absolute inset-0 -z-10 size-full object-cover opacity-75" /> : null}<div><p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/70">{label}</p><h2 className="sf-font-display mt-2 text-3xl">{product?.name ?? 'Reveal product'}</h2></div></div>
}
