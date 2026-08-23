import type { ModuleDef, ModuleKey } from './types'

import { config as catalog } from './catalog/module.config'
import { config as orders } from './orders/module.config'
import { config as cms } from './cms/module.config'
import { config as storefront } from './storefront/module.config'
import { config as drops } from './drops/module.config'

/** Lookup by key. */
export const MODULES: Partial<Record<ModuleKey, ModuleDef>> = {
  catalog,
  orders,
  cms,
  storefront,
  drops,
}

/** Canonical sidebar/iteration order (distinct from MODULES' key order). */
export const MODULE_LIST: ModuleDef[] = [
  catalog,
  orders,
  cms,
  storefront,
  drops,
]

/**
 * Always-on nav, independent of enabled modules. Dashboard renders first;
 * Media / Staff / Audit Log / Settings render as a separate bottom nav
 * group in the sidebar UI (a rendering concern, not encoded here).
 */
export const CORE_NAV: { label: string; href: string; icon: string }[] = [
  { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
  { label: 'Media', href: '/admin/media', icon: 'Image' },
  { label: 'Staff', href: '/admin/staff', icon: 'UserCog' },
  { label: 'Audit Log', href: '/admin/audit', icon: 'ScrollText' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
]
