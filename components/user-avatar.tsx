import type { CSSProperties } from 'react'

import Image from 'next/image'

import { cn } from '@/lib/utils'
import { schemeRgb } from '@/lib/warera/color-schemes'

interface Props {
  src: string | null | undefined
  /**
   * Username, for the alt text and the fallback initial.
   */
  name: string
  size: number
  /**
   * The player's WarEra color scheme; when set, draws a thin ring in that
   * color around the avatar. No scheme means no ring (matches the game).
   */
  colorScheme?: string | null
  className?: string
  style?: CSSProperties
}

/**
 * Round user avatar with a thin ring in the player's color scheme (neutral
 * border as fallback). Falls back to the username's first initial on a muted
 * disc when no avatar is set (~17% of players). Uses next/image; the host is
 * allowlisted in next.config.
 *
 * Callers that need a different ring (e.g. the detail header's thicker
 * card+scheme double ring) can override `boxShadow` via `style`.
 */
export function UserAvatar({ src, name, size, colorScheme, className, style }: Props) {
  const base = cn('shrink-0 rounded-full object-cover', className)
  // Only schemes that resolve to a color get a ring; no scheme = no ring
  // (matches the game). box-shadow is outside layout, so omitting it shifts
  // nothing.
  const ring = colorScheme ? { boxShadow: `0 0 0 1px rgb(${schemeRgb(colorScheme)})` } : undefined
  const merged = { width: size, height: size, ...ring, ...style }

  if (!src) {
    return (
      <span
        className={cn('bg-muted text-muted-foreground inline-flex items-center justify-center font-medium', base)}
        style={{ fontSize: Math.round(size * 0.4), ...merged }}
        aria-label={name}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      className={base}
      style={merged}
      unoptimized
    />
  )
}
