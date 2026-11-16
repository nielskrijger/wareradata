import type { ReactElement } from 'react'

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'

import { SHARE_SIZE } from './theme'

import 'server-only'

/**
 * Read once per process: every image needs them and they never change.
 */
let fonts: Promise<ConstructorParameters<typeof ImageResponse>[1] & object> | null = null

function loadFonts() {
  const file = (name: string) => readFile(path.join(process.cwd(), 'lib/share-image/fonts', name))
  fonts ??= Promise.all([file('BebasNeue-Regular.ttf'), file('Geist-400.ttf'), file('Geist-500.ttf')])
    .then(([bebas, geist, geistMedium]) => ({
      fonts: [
        { name: 'Bebas', data: bebas, weight: 400 as const },
        { name: 'Geist', data: geist, weight: 400 as const },
        { name: 'Geist', data: geistMedium, weight: 500 as const },
      ],
    }))

  return fonts
}

export async function renderShareImage(element: ReactElement): Promise<ImageResponse> {
  return new ImageResponse(element, {
    ...SHARE_SIZE,
    ...await loadFonts(),
    headers: {
      // Platforms cache previews for days anyway; this just spares re-renders.
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
