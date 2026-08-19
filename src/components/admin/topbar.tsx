'use client'

import { Menu, Search } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationsBell } from '@/components/admin/notifications-bell'
import { ThemeToggle } from '@/components/admin/theme-toggle'
// A1 slice owns src/lib/actions/auth.ts (logoutAction) — landing by integration time.
import { logoutAction } from '@/lib/actions/auth'
import type { Role } from '@/types/db'

interface TopbarProps {
  orgName: string
  user: { name: string; email: string }
  role: Role
  unreadCount: number
  onMenuClick: () => void
  onSearchClick: () => void
}

function initialsOf(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  return initials || 'U'
}

export function Topbar({ orgName, user, role, unreadCount, onMenuClick, onSearchClick }: TopbarProps) {
  function handleLogout() {
    // logoutAction redirects to /login on success — fire and forget.
    void logoutAction()
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="size-4" />
        </Button>
        <div className="min-w-0">
          <span className="admin-kicker block">DIR operations</span>
          <span className="mt-0.5 block truncate text-sm font-semibold tracking-[-0.02em] text-foreground">{orgName}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onSearchClick}
          className="hidden h-9 min-w-52 justify-start gap-2 border-border bg-card px-3 text-muted-foreground md:flex"
        >
          <Search className="size-3.5" />
          <span className="text-xs">Search</span>
          <kbd className="ml-auto border border-border bg-muted px-1.5 py-0.5 text-[9px] font-semibold tracking-wide">
            ⌘K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSearchClick}
          className="md:hidden"
          aria-label="Search"
        >
          <Search className="size-4" />
        </Button>

        <NotificationsBell initialUnreadCount={unreadCount} />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-8 rounded-sm">
              <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
              <span className="text-sm font-medium text-foreground">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              <span className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                {role}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
