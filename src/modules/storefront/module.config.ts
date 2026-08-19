import type { ModuleDef } from '@/modules/types'

export const config: ModuleDef = {
  key: 'storefront',
  name: 'Storefront',
  description: 'Public storefront theme and checkout settings.',
  nav: [{ label: 'Storefront', href: '/admin/storefront', icon: 'Store' }],
}
