'use client'

import * as React from 'react'
import Image from 'next/image'
import { ArrowRight, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import { useCart } from '@/components/store/cart-context'
import { ProductColorSizeSelector } from '@/components/store/product-color-size-selector'
import type { PublicRevealDrop, PublicRevealVariant } from '../public'

type Campaign = 'mens' | 'womens'
type PurchaseType = 'buy_now' | 'pre_order'

function option(variant: PublicRevealVariant, key: string): string | null {
  const value = variant.options[key]
  return typeof value === 'string' ? value : null
}

function valuesFor(variants: PublicRevealVariant[], key: string) {
  return [...new Set(variants.map((variant) => option(variant, key)).filter((value): value is string => Boolean(value)))]
}

function initialFit(variants: PublicRevealVariant[], campaign: Campaign): string | null {
  const fits = valuesFor(variants, 'fit')
  return fits.find((fit) => fit.toLowerCase().includes(campaign === 'mens' ? 'men' : 'women')) ?? fits[0] ?? null
}

function initialVariant(variants: PublicRevealVariant[], campaign: Campaign): PublicRevealVariant | null {
  const preferredFit = initialFit(variants, campaign)
  return variants.find((variant) => option(variant, 'fit') === preferredFit && variant.stockQty > 0)
    ?? variants.find((variant) => variant.isDefault && variant.stockQty > 0)
    ?? variants.find((variant) => variant.stockQty > 0)
    ?? variants.find((variant) => option(variant, 'fit') === preferredFit)
    ?? variants[0]
    ?? null
}

function CampaignTile({ campaign, image, selected, onDiscover }: { campaign: Campaign; image: PublicRevealDrop['mensImage']; selected: boolean; onDiscover: () => void }) {
  const label = campaign === 'mens' ? "Men's campaign" : "Women's campaign"
  return (
    <section className="group relative isolate min-h-[50svh] overflow-hidden bg-neutral-900 lg:min-h-svh">
      <Image src={image.src} alt={image.alt || label} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="-z-20 object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.02]" />
      <div aria-hidden="true" className={cn('absolute inset-0 -z-10 bg-black/25 transition-colors', selected && 'bg-black/10')} />
      <div className="flex min-h-[50svh] flex-col justify-between p-6 text-white sm:p-9 lg:min-h-svh lg:p-10">
        <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-white/80">{label}</p>
        <div className="flex items-end justify-between gap-5">
          <div className="lg:hidden"><p className="font-[family-name:var(--font-primary)] text-3xl font-light tracking-[-0.05em] sm:text-5xl">DIR</p><p className="mt-2 text-[9px] tracking-[0.22em] uppercase text-white/75">THE FOUNDATION</p></div>
          <button type="button" onClick={onDiscover} className="inline-flex min-h-11 items-center gap-2 border border-white/70 bg-black/15 px-4 text-[10px] font-medium tracking-[0.18em] uppercase backdrop-blur-sm transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            Discover <ArrowRight className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}

function RevealProductPanel({ drop, campaign, onClose }: { drop: PublicRevealDrop; campaign: Campaign; onClose?: () => void }) {
  const router = useRouter()
  const { add } = useCart()
  const variants = drop.product.variants
  const fits = valuesFor(variants, 'fit')
  const initial = React.useMemo(() => initialVariant(variants, campaign), [campaign, variants])

  // Fit selection (reveal-specific)
  const [fit, setFit] = React.useState<string | null>(() => initial ? option(initial, 'fit') : null)

  // Selected variant ID for color+size selector
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(() => initial?.id ?? null)

  const [purchaseType, setPurchaseType] = React.useState<PurchaseType>('buy_now')
  const [customize, setCustomize] = React.useState(false)
  const [customizationText, setCustomizationText] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  // Filter variants by selected fit
  const fitFilteredVariants = React.useMemo(() => {
    if (!fit || fits.length === 0) return variants
    return variants.filter((v) => option(v, 'fit') === fit)
  }, [variants, fit, fits.length])

  // Get selected variant details
  const selected = fitFilteredVariants.find((v) => v.id === selectedVariantId) ?? null

  const productAvailable = !drop.product.trackStock || drop.product.allowBackorder || drop.product.stockQty > 0
  const selectionReady = variants.length > 0 ? Boolean(selected) : productAvailable
  const price = selected?.price ?? drop.product.price

  // Handle fit selection change
  function chooseFit(value: string) {
    setFit(value)
    setSelectedVariantId(null) // Reset color+size selection when fit changes
    setError(null)
  }

  // Check if a fit option should be disabled (no available variants for that fit)
  function fitDisabled(fitValue: string) {
    return !variants.some((v) => {
      if (drop.product.trackStock && !drop.product.allowBackorder && v.stockQty <= 0) return false
      return option(v, 'fit') === fitValue
    })
  }

  function continueToCheckout(type: PurchaseType) {
    if (!selectionReady) {
      setError('Choose all available options.')
      return
    }
    const text = customize ? customizationText.trim() : null
    if (type === 'pre_order' && customize && !text) {
      setError('Enter the name or text for customization.')
      return
    }
    if (text && text.length > 10) {
      setError('Customization must be 10 characters or fewer.')
      return
    }

    add({
      lineKey: `reveal-${drop.id}-${selected?.id ?? 'default'}-${type}-${text ?? 'standard'}-${Date.now()}`,
      productId: drop.product.id,
      variantId: selected?.id ?? null,
      name: drop.product.name,
      variantName: selected?.name ?? null,
      unitPrice: selected?.price ?? drop.product.price,
      image: drop.product.image,
      qty: 1,
      reveal: {
        dropId: drop.id,
        purchaseType: type,
        fit: selected ? option(selected, 'fit') : null,
        color: selected ? option(selected, 'color') : null,
        size: selected ? option(selected, 'size') : null,
        customizationText: type === 'pre_order' ? text : null,
      },
    })
    router.push('/cart?from=reveal')
  }

  return (
    <div className="relative flex min-h-full flex-col bg-[#f7f5f1] p-6 text-neutral-950 sm:p-9 lg:p-12">
      {onClose && <button type="button" onClick={onClose} className="absolute right-5 top-5 grid size-11 place-items-center border border-neutral-300 bg-white text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-black lg:hidden" aria-label="Close product panel"><X className="size-4" /></button>}

      {/* Product Header */}
      <div className="flex gap-4 pr-12 lg:pr-0">
        {drop.product.image && (
          <div className="relative hidden aspect-[3/4] w-20 shrink-0 overflow-hidden bg-neutral-200 sm:block">
            <Image src={drop.product.image} alt="" fill sizes="80px" className="object-cover" />
          </div>
        )}
        <div>
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-neutral-500">
            {drop.number} · First reveal
          </p>
          <h1 className="font-[family-name:var(--font-primary)] mt-3 text-4xl font-light leading-none tracking-[-0.05em] sm:text-5xl">
            {drop.product.name}
          </h1>
          {drop.product.color && (
            <p className="mt-3 text-[10px] font-medium tracking-[0.16em] uppercase text-neutral-600">
              Color · <span className="text-neutral-950">{drop.product.color}</span>
            </p>
          )}
          <p className="mt-5 text-xl font-medium tabular-nums">{formatMoney(price)}</p>
        </div>
      </div>

      <div className="mt-10 space-y-7">
        {/* Fit Selection (only show if product has fit variants) */}
        {fits.length > 0 && (
          <div>
            <p className="mb-3 text-[10px] font-medium tracking-[0.18em] uppercase text-neutral-500">Fit</p>
            <div className="flex flex-wrap gap-2">
              {fits.map((fitValue) => {
                const active = fit === fitValue
                const disabled = fitDisabled(fitValue)
                return (
                  <button
                    key={fitValue}
                    type="button"
                    disabled={disabled}
                    onClick={() => chooseFit(fitValue)}
                    className={cn(
                      'min-h-10 border px-3 text-[10px] font-medium tracking-[0.12em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-black',
                      active ? 'border-black bg-black text-white' : 'border-neutral-300 bg-transparent hover:border-black',
                      disabled && 'cursor-not-allowed border-neutral-200 bg-neutral-200 text-neutral-400 line-through'
                    )}
                  >
                    {fitValue}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Color + Size Selection (using reusable component) */}
        {fitFilteredVariants.length > 0 && (
          <ProductColorSizeSelector
            key={fit ?? 'all-fits'}
            variants={fitFilteredVariants}
            trackStock={drop.product.trackStock}
            allowBackorder={drop.product.allowBackorder}
            lowStockThreshold={5}
            selectedVariantId={selectedVariantId}
            onVariantSelect={(id) => {
              setSelectedVariantId(id)
              setError(null)
            }}
            className="[&>*]:!text-[10px] [&>*]:!tracking-[0.18em] [&>*]:!uppercase [&_button]:!min-h-10 [&_button]:!text-[10px] [&_button]:!tracking-[0.12em]"
          />
        )}

        {/* Purchase Type */}
        <div className="border-t border-neutral-300 pt-7">
          <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-neutral-500">Purchase</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setPurchaseType('buy_now')
                setCustomize(false)
                setError(null)
              }}
              className={cn(
                'min-h-11 border text-[10px] font-medium tracking-[0.14em] uppercase',
                purchaseType === 'buy_now' ? 'border-black bg-black text-white' : 'border-neutral-300'
              )}
            >
              Buy now
            </button>
            <button
              type="button"
              onClick={() => {
                setPurchaseType('pre_order')
                setError(null)
              }}
              className={cn(
                'min-h-11 border text-[10px] font-medium tracking-[0.14em] uppercase',
                purchaseType === 'pre_order' ? 'border-black bg-black text-white' : 'border-neutral-300'
              )}
            >
              Pre-order
            </button>
          </div>
        </div>

        {/* Customization (Pre-order only) */}
        {purchaseType === 'pre_order' && (
          <div className="border-t border-neutral-300 pt-7">
            <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-neutral-500">Make it yours</p>
            <p className="mt-2 text-sm text-neutral-600">Would you like your name or custom text added?</p>
            <div className="mt-4 flex gap-5 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!customize}
                  onChange={() => {
                    setCustomize(false)
                    setCustomizationText('')
                  }}
                />
                No customization
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={customize} onChange={() => setCustomize(true)} />
                Yes, customize
              </label>
            </div>
            {customize && (
              <div className="mt-4">
                <label htmlFor="reveal-customization" className="text-[10px] font-medium tracking-[0.16em] uppercase text-neutral-600">
                  Enter your name
                </label>
                <input
                  id="reveal-customization"
                  value={customizationText}
                  onChange={(event) => setCustomizationText(event.target.value.slice(0, 10))}
                  maxLength={10}
                  className="mt-2 h-11 w-full border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black"
                />
                <p className="mt-1 text-xs text-neutral-500">Maximum 10 characters</p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-5 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-auto pt-10">
        <button
          type="button"
          onClick={() => continueToCheckout(purchaseType)}
          disabled={!selectionReady}
          className="flex min-h-12 w-full items-center justify-center bg-black px-5 text-[10px] font-semibold tracking-[0.2em] uppercase text-white transition-colors hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {purchaseType === 'pre_order' ? 'Pre-order now' : 'Buy now'}
        </button>
      </div>
    </div>
  )
}

export function RevealExperience({ drop }: { drop: PublicRevealDrop }) {
  const [selectedCampaign, setSelectedCampaign] = React.useState<Campaign | null>(null)
  const [isDesktop, setIsDesktop] = React.useState(false)
  React.useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)')
    const syncViewport = () => setIsDesktop(query.matches)
    syncViewport()
    query.addEventListener('change', syncViewport)
    return () => query.removeEventListener('change', syncViewport)
  }, [])
  const mobileOpen = Boolean(selectedCampaign && !isDesktop)
  return (
    <main className="relative min-h-[100svh] bg-black">
      <div className={cn('hidden lg:grid lg:min-h-[100svh]', selectedCampaign ? 'lg:grid-cols-2' : 'lg:grid-cols-2')}>
        {selectedCampaign ? <div className="grid min-h-svh grid-cols-2"><CampaignTile campaign="mens" image={drop.mensImage} selected={selectedCampaign === 'mens'} onDiscover={() => setSelectedCampaign('mens')} /><CampaignTile campaign="womens" image={drop.womensImage} selected={selectedCampaign === 'womens'} onDiscover={() => setSelectedCampaign('womens')} /></div> : <><CampaignTile campaign="mens" image={drop.mensImage} selected={false} onDiscover={() => setSelectedCampaign('mens')} /><CampaignTile campaign="womens" image={drop.womensImage} selected={false} onDiscover={() => setSelectedCampaign('womens')} /></>}
        {selectedCampaign && <RevealProductPanel key={selectedCampaign} drop={drop} campaign={selectedCampaign} />}
      </div>
      <div className="lg:hidden"><CampaignTile campaign="mens" image={drop.mensImage} selected={selectedCampaign === 'mens'} onDiscover={() => setSelectedCampaign('mens')} /><CampaignTile campaign="womens" image={drop.womensImage} selected={selectedCampaign === 'womens'} onDiscover={() => setSelectedCampaign('womens')} /></div>
      {!selectedCampaign && <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 hidden items-center justify-center lg:flex"><span className="font-[family-name:var(--font-primary)] text-[clamp(9rem,20vw,20rem)] font-bold leading-none tracking-[-0.1em] text-white/95 drop-shadow-[0_8px_28px_rgba(0,0,0,0.35)]">DIR</span></div>}
      <Dialog open={mobileOpen} onOpenChange={(open) => !open && setSelectedCampaign(null)}><DialogContent showCloseButton={false} className="h-[100svh] max-h-none w-screen max-w-none translate-x-[-50%] translate-y-[-50%] rounded-none border-0 p-0"><DialogTitle className="sr-only">{drop.product.name}</DialogTitle><DialogDescription className="sr-only">Choose a fit, color, size, and purchase option for this product.</DialogDescription><div className="h-full overflow-y-auto">{selectedCampaign && <RevealProductPanel key={selectedCampaign} drop={drop} campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />}</div></DialogContent></Dialog>
    </main>
  )
}
