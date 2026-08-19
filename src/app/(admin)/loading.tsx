function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />
}

export default function AdminLoading() {
  return (
    <main className="flex flex-col gap-8 p-5 sm:p-8" aria-live="polite" aria-label="Loading admin page">
      <div className="flex items-end justify-between border-b border-border pb-6"><div className="space-y-3"><Skeleton className="h-2 w-20" /><Skeleton className="h-9 w-56" /></div><span className="size-5 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground" /></div>
      <div className="grid gap-5 md:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-32" />)}</div>
      <Skeleton className="h-72 w-full" />
    </main>
  )
}
