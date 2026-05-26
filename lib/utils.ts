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
  const hue = 27 + (145 - 27) * (Math.min(100, Math.max(0, pct)) / 100)
  return `oklch(0.68 0.19 ${hue})`
}
