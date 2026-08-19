import type { ReactNode } from 'react'

// Role is the single canonical definition in src/types/db/core.ts — re-exported
// here so app code can depend on @/lib/types for both data and app-level shapes.
export type { Role } from '@/types/db'

/** Standard server action return shape (see docs/conventions.md — Server actions). */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

/** Next 15 App Router page props — params/searchParams are async. */
export interface PageProps<
  TParams extends Record<string, string> = Record<string, never>,
  TSearchParams extends Record<string, string | string[] | undefined> = Record<
    string,
    string | string[] | undefined
  >,
> {
  params: Promise<TParams>
  searchParams: Promise<TSearchParams>
}

/** Next 15 App Router layout props — params is async. */
export interface LayoutProps<
  TParams extends Record<string, string> = Record<string, never>,
> {
  params: Promise<TParams>
  children: ReactNode
}
