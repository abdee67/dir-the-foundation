import type { FaqBlock } from '@/types/db'

export function FaqBlockView({ block }: { block: FaqBlock }) {
  if (block.items.length === 0) return null

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h2 className="mb-5 text-lg font-semibold">FAQ</h2>
      <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {block.items.map((item, i) => (
          <details key={i} className="group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
              {item.q}
              <span className="ml-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
