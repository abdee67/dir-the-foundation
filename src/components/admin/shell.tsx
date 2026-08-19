'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/admin/sidebar'
import { Topbar } from '@/components/admin/topbar'
import { ThemeScript } from '@/components/admin/theme-toggle'
import { CommandPalette } from '@/components/admin/command-palette'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import type { NavItem } from '@/lib/modules'
import type { Org, Role } from '@/types/db'

const SIDEBAR_COLLAPSE_KEY = 'scarpar-sidebar-collapsed'

interface AdminShellProps {
  org: Org
  role: Role
  nav: { main: NavItem[]; core: NavItem[] }
  orgs: { id: string; name: string }[]
  user: { name: string; email: string }
  unreadCount: number
  children: React.ReactNode
}

export function AdminShell({ org, role, nav, orgs, user, unreadCount, children }: AdminShellProps) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [hydrated, setHydrated] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [commandOpen, setCommandOpen] = React.useState(false)

  React.useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === '1')
    } catch {
      // localStorage unavailable — default to expanded.
    }
    setHydrated(true)
  }, [])

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_COLLAPSE_KEY, next ? '1' : '0')
      } catch {
        // ignore — nothing to persist to
      }
      return next
    })
  }, [])

  const enabledModules = React.useMemo(() => new Set(org.enabled_modules), [org.enabled_modules])
  const isCollapsed = hydrated && collapsed

  return (
    <>
      <ThemeScript />
      <div className="admin-shell flex h-dvh overflow-hidden bg-background">
        <aside
          className={cn(
            'hidden shrink-0 border-r border-sidebar-border transition-[width] duration-200 lg:flex',
            isCollapsed ? 'w-[72px]' : 'w-[264px]',
          )}
        >
          <Sidebar
            org={org}
            orgs={orgs}
            nav={nav}
            collapsed={isCollapsed}
            onToggleCollapse={toggleCollapsed}
          />
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="admin-shell w-[264px] border-sidebar-border bg-sidebar p-0 sm:max-w-[264px]">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">Admin navigation menu</SheetDescription>
            <Sidebar org={org} orgs={orgs} nav={nav} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            orgName={org.name}
            user={user}
            role={role}
            unreadCount={unreadCount}
            onMenuClick={() => setMobileOpen(true)}
            onSearchClick={() => setCommandOpen(true)}
          />
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[1540px]">{children}</div>
          </main>
        </div>
      </div>

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        nav={nav}
        enabledModules={enabledModules}
      />
    </>
  )
}
