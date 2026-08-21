// Module system core types. See docs/architecture.md §2 (binding contract).

export type ModuleKey =
  | 'catalog'
  | 'orders'
  | 'cms'
  | 'storefront'
  | 'drops'

export interface ModuleDef {
  key: ModuleKey
  name: string
  description: string
  /** icon = lucide icon name (see src/lib/icon-map.tsx) */
  nav: { label: string; href: string; icon: string }[]
}
