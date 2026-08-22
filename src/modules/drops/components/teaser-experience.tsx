'use client'

import * as React from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

import { joinDropWaitlistAction } from '../waitlist-actions'
import { normalizeEthiopianPhone } from '../phone'
import { TeaserCountdown } from './teaser-countdown'

interface TeaserExperienceProps {
  dropId: string
  endsAt: string
  heroImage: { src: string; alt: string }
}

export function TeaserExperience({ dropId, endsAt, heroImage }: TeaserExperienceProps) {
  const [open, setOpen] = React.useState(false)
  const [phoneNumber, setPhoneNumber] = React.useState('')
  const [message, setMessage] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    if (!normalizeEthiopianPhone(phoneNumber)) {
      setMessage('Please enter a valid phone number.')
      return
    }
    setSubmitting(true)
    const result = await joinDropWaitlistAction(dropId, phoneNumber)
    setSubmitting(false)
    if (result.ok) {
      setMessage("You're on the list. We'll let you know when the drop is revealed.")
      setPhoneNumber('')
      return
    }
    setMessage(result.error)
  }

  return (
    <main className="relative isolate min-h-[100svh] overflow-hidden bg-black text-white">
      {/* Keep portrait campaign artwork whole. On desktop, surrounding black space
          becomes the editorial frame for copy instead of cropping over its logo. */}
      <Image src={heroImage.src} alt={heroImage.alt} fill priority sizes="(min-width: 1024px) 50vh, 100vw" className="-z-20 object-contain" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,.5),transparent_35%,transparent_65%,rgba(0,0,0,.5))]" />

      <div className="relative min-h-[100svh] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:px-8 sm:pb-12 sm:pt-10">
        <div className="absolute inset-x-5 top-[max(2rem,env(safe-area-inset-top))] text-center sm:inset-x-8 sm:top-10 lg:inset-x-auto lg:left-[7vw] lg:top-1/2 lg:w-[min(22vw,18rem)] lg:-translate-y-1/2 lg:text-left">
          <TeaserCountdown endsAt={endsAt} />
          <p className="mt-5 flex items-center justify-center gap-3 text-[9px] font-medium tracking-[0.3em] uppercase text-white/80 before:h-px before:w-7 before:bg-white/45 after:h-px after:w-7 after:bg-white/45 lg:justify-start">Limited edition</p>
        </div>

        <div className="absolute inset-x-5 top-1/2 flex -translate-y-1/2 flex-col items-center text-center lg:inset-x-auto lg:right-[7vw] lg:w-[min(22vw,18rem)]">
          <p className="font-[family-name:var(--font-primary)] text-[clamp(3rem,13vw,8.5rem)] font-light leading-[.8] tracking-[-0.08em] text-white">DIR <span lang="am" className="ml-[0.1em] font-[family-name:var(--font-bengali)] text-[.65em] tracking-normal">(ድር)</span></p>
          <p className="mt-5 text-[clamp(.65rem,1.8vw,1rem)] font-light tracking-[0.34em] uppercase text-white/90 sm:mt-7">THE FOUNDATION</p>
        </div>

        <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setMessage(null) }}>
          <DialogTrigger asChild>
            <button type="button" className="absolute inset-x-5 bottom-[max(2rem,env(safe-area-inset-bottom))] min-h-12 border border-white/75 bg-black/25 px-7 text-[10px] font-medium tracking-[0.22em] uppercase text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:inset-x-auto sm:left-1/2 sm:w-auto sm:-translate-x-1/2 sm:px-10 lg:left-[7vw] lg:translate-x-0">
              Notify me
            </button>
          </DialogTrigger>
          <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto rounded-none border-white/20 bg-black/90 p-6 text-white shadow-2xl backdrop-blur-xl sm:max-w-md sm:p-9" aria-describedby="waitlist-description">
            <DialogHeader className="pr-7 text-left">
              <DialogTitle className="font-[family-name:var(--font-primary)] text-3xl font-light tracking-[-0.05em] text-white">BE FIRST TO KNOW</DialogTitle>
              <DialogDescription id="waitlist-description" className="mt-3 text-sm leading-6 text-white/70">Enter your phone number to be notified when the drop is revealed.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
              <label className="sr-only" htmlFor="drop-waitlist-phone">Ethiopian mobile number</label>
              <input id="drop-waitlist-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+251 9XX XXX XXX" className="h-12 w-full border border-white/35 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-white focus:ring-1 focus:ring-white" />
              <button type="submit" disabled={submitting} className="flex min-h-12 w-full items-center justify-center gap-2 bg-white px-5 text-[10px] font-semibold tracking-[0.18em] uppercase text-black transition-colors hover:bg-white/85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60">
                {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {submitting ? 'Joining' : 'Join waitlist'}
              </button>
              {message && <p role="status" aria-live="polite" className="text-sm leading-6 text-white/85">{message}</p>}
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
