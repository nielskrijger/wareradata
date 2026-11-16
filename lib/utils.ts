import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Maps a 0-100 value to a colour on a red -> amber -> green hue ramp, so a low
 * reading reads as urgent and a high one as healthy. Saturated, mid-lightness
 * so it's legible on both themes. Shared by the percent / vital / health bars.
 */
export function heatColor(pct: number): string {
  return `oklch(0.68 0.19 ${heatHue(pct)})`
}

/**
 * {@link heatColor} for text. The green end is too pale to read on white, so
 * light themes darken it via `--heat-text-dim`; reds and yellows stay as is.
 */
export function heatTextColor(pct: number): string {
  const hue = heatHue(pct)
  const greenness = Math.min(1, Math.max(0, (hue - 100) / 45))

  return `oklch(calc(0.68 - ${greenness.toFixed(2)} * var(--heat-text-dim)) 0.19 ${hue})`
}

function heatHue(pct: number): number {
  return 27 + (145 - 27) * (Math.min(100, Math.max(0, pct)) / 100)
}
