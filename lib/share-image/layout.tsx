import type { ReactNode } from 'react'

import { SITE_URL } from '@/lib/metadata'

/**
 * Hex approximations of the brand's oklch fire gradient, which `next/og` can't parse.
 */
export const ORANGE = '#f5a623'
const FIRE = 'linear-gradient(90deg, #ee8a1f, #fbbd2a, #ee8a1f)'
export const MUTED = '#a3a3a3'

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

const LABEL_STYLE = { display: 'flex', fontSize: 24, fontWeight: 500, textTransform: 'uppercase' } as const

const SUBTITLE_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  fontSize: 34,
  color: MUTED,
  marginTop: 10,
} as const

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
