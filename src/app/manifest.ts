import type { MetadataRoute } from 'next'

import { BRAND_APP_ICON_192_URL, BRAND_APP_ICON_512_URL } from '@/lib/brand'

/** Browser-installable identity using the dedicated DIR app icons. */
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
        src: BRAND_APP_ICON_192_URL,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: BRAND_APP_ICON_512_URL,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
