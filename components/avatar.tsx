import type { CSSProperties } from 'react'

import Image from 'next/image'

import { Flag } from '@/components/flag'
import { cn } from '@/lib/utils'
import { schemeRgb } from '@/lib/warera/color-schemes'

interface Props {
  src: string | null | undefined

  /**
   * Display name of the pictured entity (user or MU), for the alt text and the
   * fallback initial.
   */
  name: string
  size: number

  /**
   * A WarEra color scheme; when set, draws a thin ring in that color around the
   * avatar. No scheme means no ring (matches the game). Users have one; MUs do
   * not, so MU avatars render ringless.
   */
  colorScheme?: string | null

  /**
   * Country code; when set, a small flag overlaps the avatar's bottom-left
   * corner, as on WarEra profiles.
   */
  countryCode?: string | null
  className?: string
  style?: CSSProperties
}

/**
 * Round avatar with an optional color-scheme ring, falling back to the name's
 * initial when there is no image.
 */
export function Avatar({ countryCode, ...props }: Props) {
  if (!countryCode) {
    return <AvatarImage {...props} />
  }

  // Under half the avatar's width, at the 4:3 ratio of flag-icons' sprites.
  const flagWidth = Math.round(props.size * 0.46)
  const flagHeight = Math.round(flagWidth * 0.75)
  // A slight overhang, so the flag stays clear of a table's left border.
  const flagLeft = -Math.round(props.size / 12)

  return (
    <span className="relative inline-flex shrink-0">
      <AvatarImage {...props} />
      <Flag
        code={countryCode}
        className="rounded-[1px] shadow-[0_0_0_1px_var(--card)]"
        // Inline because flag-icons' unlayered `.fi { position: relative }`
        // beats Tailwind's layered utilities.
        style={{ position: 'absolute', left: flagLeft, bottom: -1, width: flagWidth, height: flagHeight }}
      />
    </span>
  )
}

function AvatarImage({ src, name, size, colorScheme, className, style }: Omit<Props, 'countryCode'>) {
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
