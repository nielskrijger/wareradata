import { useId } from 'react'

import { BODY_END, ICON_SHADOW, OUTLINE, TRAIT_GROUPS, TRAITS } from './trait-icons'

const OUTLINE_WIDTH = 100 / 13

/**
 * A trait's icon in the game's marker; renders nothing for unknown codes.
 */
export function TraitIcon({ code, label }: { code: string, label: string }) {
  const gradientId = useId()
  const trait = TRAITS[code]
  if (!trait) {
    return null
  }

  const g = TRAIT_GROUPS[trait.group]

  return (
    <span
      role="img"
      aria-label={label}
      className="relative inline-flex size-[26px] shrink-0 items-center justify-center"
    >
      <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full overflow-visible">
        <defs>
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="100" y2="0">
            <stop offset="0%" stopColor={g.body} />
            <stop offset="100%" stopColor={BODY_END} />
          </linearGradient>
        </defs>
        {/* Outline plus the same outline shifted down as a hard shadow. */}
        <path
          d={g.shape}
          fill={OUTLINE}
          stroke={OUTLINE}
          strokeWidth={OUTLINE_WIDTH}
          transform={`translate(0 ${OUTLINE_WIDTH / 2})`}
        />
        <path d={g.shape} fill={OUTLINE} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />
        <path d={g.shape} fill={`url(#${gradientId})`} />
      </svg>
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="relative size-[19px]"
        style={{ color: g.icon, top: g.iconOffset, filter: `drop-shadow(1px 1px 0 ${ICON_SHADOW})` }}
      >
        <path d={trait.icon} fill="currentColor" />
      </svg>
    </span>
  )
}
