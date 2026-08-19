import type { ModuleDef } from '@/modules/types'

export const config: ModuleDef = {
  key: 'catalog',
  name: 'Catalog',
  description: 'Products, categories, and inventory management.',
  nav: [
    { label: 'Products', href: '/admin/products', icon: 'Package' },
    { label: 'Categories', href: '/admin/categories', icon: 'Package' },
    { label: 'Inventory', href: '/admin/inventory', icon: 'Package' },
  ],
}
