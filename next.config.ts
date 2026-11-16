import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Keeps full-route prefetching until partial prefetching is tested.
  partialPrefetching: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.warera.io' },
    ],
  },
}

export default nextConfig
