'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

interface SettingsNavProps {
  sections: { id: string; label: string }[]
}

/** Sticky left anchor nav with IntersectionObserver-driven active highlighting. */
function SettingsNav({ sections }: SettingsNavProps) {
  const [activeId, setActiveId] = React.useState(sections[0]?.id)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-10% 0px -70% 0px' },
    )

    for (const section of sections) {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [sections])

  return (
    <nav className="sticky top-6 flex w-44 shrink-0 flex-col gap-0.5 self-start">
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={cn(
            'rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
            activeId === section.id
              ? 'bg-accent text-accent-foreground font-medium'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          {section.label}
        </a>
      ))}
    </nav>
  )
}

export { SettingsNav }
