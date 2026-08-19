function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-neutral-200/80 ${className}`} />
}

export default function StoreLoading() {
  return (
    <main className="sf-container py-12 sm:py-16" aria-live="polite" aria-label="Loading page">
      <div className="mb-10 flex items-end justify-between border-b border-neutral-200 pb-5">
        <div className="space-y-3"><Skeleton className="h-2 w-24" /><Skeleton className="h-9 w-48 sm:h-11 sm:w-72" /></div>
        <span className="size-5 animate-spin rounded-full border border-neutral-300 border-t-neutral-900" />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 sm:gap-x-5 sm:gap-y-10">
        {Array.from({ length: 8 }, (_, index) => <div key={index} className="space-y-3"><Skeleton className="aspect-[3/4] w-full" /><Skeleton className="h-3 w-4/5" /><Skeleton className="h-3 w-2/5" /></div>)}
      </div>
    </main>
  )
}
