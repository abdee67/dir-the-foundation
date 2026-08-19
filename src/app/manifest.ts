import type { MetadataRoute } from 'next'

import { DEFAULT_BRAND_LOGO_URL } from '@/lib/brand'

/** Browser-installable identity, using the same approved DIR logo as the site. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DIR (ድር) THE FOUNDATION',
    short_name: 'DIR',
    description: 'Considered Ethiopian fashion for everyday life.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: DEFAULT_BRAND_LOGO_URL,
        sizes: '360x720',
        type: 'image/jpeg',
      },
    ],
  }
}
