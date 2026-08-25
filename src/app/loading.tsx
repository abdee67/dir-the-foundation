export default function RootLoading() {
  return (
    <main className="grid min-h-svh place-items-center bg-[#f7f6f4] text-neutral-900" aria-live="polite" aria-label="Loading page">
      <div className="flex flex-col items-center gap-4">
        <span className="sf-font-display text-2xl tracking-[-0.04em]">DIR - THE FOUNDATION</span>
        <span className="size-5 animate-spin rounded-full border border-neutral-300 border-t-neutral-900" />
      </div>
    </main>
  )
}
