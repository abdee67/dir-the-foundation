import type { ModuleDef } from '@/modules/types'

export const config: ModuleDef = {
  key: 'cms',
  name: 'CMS',
  description: 'Page builder and site menus for the storefront.',
  nav: [
    { label: 'Pages', href: '/admin/cms/pages', icon: 'LayoutTemplate' },
    { label: 'Menus', href: '/admin/cms/menus', icon: 'LayoutTemplate' },
  ],
}
