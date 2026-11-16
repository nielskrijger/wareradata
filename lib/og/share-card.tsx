import type { ReactElement, ReactNode } from 'react'

import { Buffer } from 'node:buffer'

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { SITE_URL } from '@/lib/metadata'

import 'server-only'

export const SHARE_SIZE = { width: 1200, height: 630 }

/**
 * Hex approximations of the brand's oklch fire gradient, which Satori can't parse.
 */
export const ORANGE = '#f5a623'
const FIRE = 'linear-gradient(90deg, #ee8a1f, #fbbd2a, #ee8a1f)'
export const MUTED = '#a3a3a3'

const LABEL_STYLE = { display: 'flex', fontSize: 24, fontWeight: 500, textTransform: 'uppercase' } as const

const SUBTITLE_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  fontSize: 34,
  color: MUTED,
  marginTop: 10,
} as const

const TANK_SVG = `<svg viewBox="2 8 28 14" xmlns="http://www.w3.org/2000/svg" fill="${ORANGE}">
  <path d="M3 17 L29 17 L27 14 L5 14 Z"/>
  <circle cx="7" cy="19" r="2.5"/><circle cx="13" cy="19" r="2.5"/>
  <circle cx="19" cy="19" r="2.5"/><circle cx="25" cy="19" r="2.5"/>
  <rect x="10" y="9" width="10" height="5" rx="1"/>
  <path d="M20 11.5 L24 11.5 L26 8.5 L29 9.5" fill="none"
    stroke="${ORANGE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="29" cy="9.5" r="1.1"/>
</svg>`

const TANK_SRC = `data:image/svg+xml,${encodeURIComponent(TANK_SVG)}`

/**
 * Read once per process: every image needs them and they never change.
 */
let fonts: Promise<ConstructorParameters<typeof ImageResponse>[1] & object> | null = null

function loadFonts() {
  const file = (name: string) => readFile(path.join(process.cwd(), 'lib/og/fonts', name))
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

/**
 * A flag from the `flag-icons` package as a data URI, or null for an unknown code.
 */
export async function flagSrc(code: string | null): Promise<string | null> {
  if (!code || !/^[a-z]{2}$/i.test(code)) {
    return null
  }

  try {
    const file = path.join(process.cwd(), 'node_modules/flag-icons/flags/4x3', `${code.toLowerCase()}.svg`)
    const svg = await readFile(file)

    return `data:image/svg+xml;base64,${svg.toString('base64')}`
  } catch {
    return null
  }
}

/**
 * Fetches an avatar as a data URI, so a slow or missing image falls back to
 * the initial instead of failing the whole render.
 *
 * Only PNG and JPEG: Satori can't decode WebP.
 */
export async function avatarSrc(url: string | null): Promise<string | null> {
  if (!url) {
    return null
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) })
    const type = res.headers.get('content-type') ?? ''
    if (!res.ok || !/^image\/(?:png|jpeg)/.test(type)) {
      return null
    }

    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`
  } catch {
    return null
  }
}

export interface Emblem {
  src: string | null

  /**
   * Flags keep their 4:3 shape; avatars are cropped to a circle.
   */
  shape: 'flag' | 'avatar'

  /**
   * Drawn in place of a missing image.
   */
  fallback: string
}

export interface Stat {
  label: string
  value: string

  /**
   * Leaderboard position, shown after the label.
   */
  rank?: number | null
}

export interface ShareCard {
  /**
   * The page type, e.g. "Player" or "Country".
   */
  kicker: string
  title: string
  subtitle?: ReactNode
  emblem?: Emblem
  stats: Stat[]
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

export function formatCompact(n: number | null | undefined): string {
  return n == null ? '—' : compact.format(n)
}

export function EmblemImage({ emblem, size }: { emblem: Emblem, size: number }) {
  const isFlag = emblem.shape === 'flag'
  const width = isFlag ? Math.round(size * 4 / 3) : size
  const radius = isFlag ? 8 : size / 2

  if (emblem.src) {
    return (
      <img src={emblem.src} width={width} height={size} alt="" style={{ borderRadius: radius, objectFit: 'cover' }} />
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width,
        height: size,
        borderRadius: radius,
        backgroundImage: FIRE,
        color: '#0a0a0a',
        fontFamily: 'Bebas',
        fontSize: size * 0.6,
        paddingTop: size * 0.08,
      }}
    >
      {emblem.fallback.slice(0, 1).toUpperCase()}
    </div>
  )
}

function StatTile({ stat }: { stat: Stat }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
      <div style={{ ...LABEL_STYLE, gap: 10, color: MUTED, letterSpacing: 1 }}>
        <span>{stat.label}</span>
        {stat.rank ? <span style={{ color: ORANGE }}>#{stat.rank.toLocaleString('en')}</span> : null}
      </div>
      <div style={{ display: 'flex', fontFamily: 'Bebas', fontSize: 76, lineHeight: 1, marginTop: 8 }}>
        {stat.value}
      </div>
    </div>
  )
}

/**
 * Brand bar on top and the fire stripe below, around any page-specific body.
 */
export function CardFrame({ kicker, children }: { kicker: string, children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: '56px 80px 0',
        background: '#0a0a0a',
        backgroundImage: 'radial-gradient(circle at 88% 12%, rgba(245,166,35,0.16), transparent 50%)',
        color: '#fafafa',
        fontFamily: 'Geist',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src={TANK_SRC} width={72} height={36} alt="" />
          <div style={{ display: 'flex', fontFamily: 'Bebas', fontSize: 40, letterSpacing: 2, paddingTop: 6 }}>
            Warera Data
          </div>
        </div>
        <div style={{ ...LABEL_STYLE, color: ORANGE, letterSpacing: 3 }}>
          {kicker}
        </div>
      </div>

      {children}

      <div style={{ display: 'flex', position: 'absolute', inset: 'auto 0 0 0', height: 10, backgroundImage: FIRE }} />
      <div style={{ display: 'flex', position: 'absolute', right: 80, bottom: 26, fontSize: 22, color: '#737373' }}>
        {new URL(SITE_URL).host}
      </div>
    </div>
  )
}

/**
 * The layout for an entity page: emblem and name, then up to four stats.
 */
export function EntityCard({ kicker, title, subtitle, emblem, stats }: ShareCard) {
  return (
    <CardFrame kicker={kicker}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 44, marginTop: 64 }}>
        {emblem ? <EmblemImage emblem={emblem} size={160} /> : null}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'block',
              fontFamily: 'Bebas',
              fontSize: title.length > 16 ? 96 : 128,
              lineHeight: 1,
              paddingTop: 12,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
          {subtitle
            ? <div style={SUBTITLE_STYLE}>{subtitle}</div>
            : null}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 40, marginTop: 'auto', marginBottom: 56 }}>
        {stats.slice(0, 4).map(s => <StatTile key={s.label} stat={s} />)}
      </div>
    </CardFrame>
  )
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
