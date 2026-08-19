'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

export interface AccordionItem {
  id: string
  title: string
  content: React.ReactNode
  defaultOpen?: boolean
}

export function ProductAccordion({ items }: { items: AccordionItem[] }) {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const item of items) {
      if (item.defaultOpen) initial[item.id] = true
    }
    return initial
  })

  function toggle(id: string) {
    setOpenMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <div className="flex flex-col divide-y divide-neutral-200 border-y border-neutral-200">
      {items.map((item) => {
        const isOpen = Boolean(openMap[item.id])
        return (
          <div key={item.id} className="py-3.5">
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="flex w-full items-center justify-between text-left text-xs font-semibold tracking-[0.16em] uppercase text-neutral-900 transition-colors hover:text-black"
              aria-expanded={isOpen}
            >
              <span>{item.title}</span>
              <span className="text-neutral-500">
                {isOpen ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
              </span>
            </button>

            {isOpen && (
              <div className="mt-3 text-xs leading-relaxed text-neutral-600">
                {item.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
