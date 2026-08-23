import type { ModuleDef } from '@/modules/types'

export const config: ModuleDef = {
  key: 'drops',
  name: 'Drop management',
  description: 'Campaign drops, launch phases, waitlists, and release control.',
  nav: [{ label: 'Drops', href: '/admin/drops', icon: 'Sparkles' }],
}
