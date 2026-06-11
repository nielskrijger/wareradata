import type { CSSProperties } from 'react'

import { Avatar } from '@/components/avatar'
import { cn } from '@/lib/utils'
import { schemeRgb } from '@/lib/warera/color-schemes'

/**
 * First user-perceived character of the alliance name, for the monogram
 * fallback. Grapheme-aware so a ZWJ emoji name (🐦‍🔥) keeps its full glyph.
 */
function firstGrapheme(value: string): string {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const [first] = new Intl.Segmenter().segment(value)
    if (first) {
      return first.segment
    }
  }
  return Array.from(value)[0] ?? '?'
}

interface Props {
  name: string
  avatarUrl: string | null
  /**
   * WarEra color scheme name, the monogram fallback's fill.
   */
  scheme: string
  size: number
  className?: string
  style?: CSSProperties
}

/**
 * An alliance's logo when it has uploaded one, otherwise a scheme-colored
 * monogram square. Shared by the detail header emblem and the /alliances
 * identity cell, so the two render the same identity at different sizes.
 */
export function AllianceAvatar({ name, avatarUrl, scheme, size, className, style }: Props) {
  if (avatarUrl) {
    return <Avatar src={avatarUrl} name={name} size={size} className={className} style={style} />
  }

  return (
    <div
      className={cn('font-brand flex shrink-0 items-center justify-center rounded-md text-white', className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.45),
        background: `rgb(${schemeRgb(scheme)})`,
        ...style,
      }}
    >
      {firstGrapheme(name)}
    </div>
  )
}
