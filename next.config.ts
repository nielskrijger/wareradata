import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.warera.io' },
      // Item / skin icons served by the SPA (e.g. /images/items/helmet.png).
      { protocol: 'https', hostname: 'app.warera.io' },
    ],
  },
}

export default nextConfig
