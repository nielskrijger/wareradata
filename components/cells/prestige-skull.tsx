import { cn } from '@/lib/utils'
import { schemeRgb } from '@/lib/warera/color-schemes'

/**
 * Material Design Icons' skull, the icon the game uses.
 */
const SKULL_PATH = [
  'M12,2A9,9 0 0,0 3,11C3,14.03 4.53,16.82 7,18.47V22H9V19H11V22H13V19H15V22H17V18.46',
  'C19.47,16.81 21,14 21,11A9,9 0 0,0 12,2M8,11A2,2 0 0,1 10,13A2,2 0 0,1 8,15A2,2 0 0,1 6,13',
  'A2,2 0 0,1 8,11M16,11A2,2 0 0,1 18,13A2,2 0 0,1 16,15A2,2 0 0,1 14,13A2,2 0 0,1 16,11',
  'M12,14L13.5,17H10.5L12,14Z',
].join('')

interface Props {
  /**
   * Times the player prestiged; renders nothing below 1.
   */
  prestige: number | null | undefined
  colorScheme: string | null | undefined
  className?: string
}

/**
 * The game's prestige mark: a skull tinted in the player's color scheme, with
 * the prestige count as a superscript.
 */
export function PrestigeSkull({ prestige, colorScheme, className }: Props) {
  if (!prestige || prestige < 1) {
    return null
  }
  const color = `rgb(${schemeRgb(colorScheme)})`
  return (
    <span
      className={cn('inline-flex shrink-0 items-center', className)}
      style={{ color }}
      aria-label={`Prestige ${prestige}`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-[1.1em]" aria-hidden="true">
        <path d={SKULL_PATH} />
      </svg>
      <sup className="ml-px text-[0.68em] font-bold leading-none">{prestige}</sup>
    </span>
  )
}
