import type { CSSProperties } from 'react'

import { cn } from '@/lib/utils'

interface Props {
  code: string | null | undefined
  className?: string
  style?: CSSProperties
}

/**
 * Renders a country flag from an ISO 3166-1 alpha-2 code using the
 * `flag-icons` CSS sprite. Returns null for missing codes so callers can
 * compose with other "—" placeholders.
 */
export function Flag({ code, className, style }: Props) {
  if (!code) {
    return null
  }
  return (
    <span
      className={cn(
        `fi fi-${code.toLowerCase()}`,
        // .fi defaults to 1em; bump to ~16x12 and round the corners.
        'inline-block h-3 w-4 shrink-0 rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]',
        className,
      )}
      style={style}
      aria-label={code}
    />
  )
}
