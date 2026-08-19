'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { FilePlus, type LucideIcon } from 'lucide-react'

import { getIcon } from '@/lib/icon-map'
import type { NavItem } from '@/lib/modules'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'

interface QuickAction {
  label: string
  href: string
  icon: LucideIcon
}

const QUICK_ACTION_DEFS: (QuickAction & { moduleKey: string })[] = [
  { label: 'New product', href: '/admin/products/new', icon: FilePlus, moduleKey: 'catalog' },
]

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nav: { main: NavItem[]; core: NavItem[] }
  enabledModules: Set<string>
}

/** CommandDialog with every nav item + module-gated quick actions. Owns the global ⌘K/ctrl+K listener. */
export function CommandPalette({ open, onOpenChange, nav, enabledModules }: CommandPaletteProps) {
  const router = useRouter()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (typeof event.key === 'string' && event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  const go = React.useCallback(
    (href: string) => {
      onOpenChange(false)
      router.push(href)
    },
    [onOpenChange, router],
  )

  const quickActions = QUICK_ACTION_DEFS.filter((action) => enabledModules.has(action.moduleKey))
  const allNav = [...nav.core, ...nav.main]

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, or jump to an action…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {quickActions.length > 0 && (
          <>
            <CommandGroup heading="Quick actions">
              {quickActions.map((action) => (
                <CommandItem key={action.href} value={action.label} onSelect={() => go(action.href)}>
                  <action.icon className="size-4" />
                  {action.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        <CommandGroup heading="Go to">
          {allNav.map((item) => {
            const Icon = getIcon(item.icon)
            return (
              <CommandItem key={item.href} value={item.label} onSelect={() => go(item.href)}>
                <Icon className="size-4" />
                {item.label}
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
