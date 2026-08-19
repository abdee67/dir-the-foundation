import type { ModuleDef } from '@/modules/types'

export const config: ModuleDef = {
  key: 'orders',
  name: 'Orders',
  description: 'Manual-payment clothing orders from verification to delivery.',
  nav: [
    { label: 'Orders',   href: '/admin/orders',   icon: 'ShoppingCart' },
    { label: 'Payments', href: '/admin/payments', icon: 'CreditCard'   },
    { label: 'Delivery zones', href: '/admin/delivery-zones', icon: 'Truck' },
  ],
}
