// Buff = green, ready = sky, debuff = red. Saturated mid-lightness so each
// reads on both themes; a thin card-coloured seam separates adjacent segments.
export const GREEN = 'oklch(0.68 0.19 145)'
export const SKY = 'oklch(0.68 0.15 240)'
export const RED = 'oklch(0.63 0.21 27)'
export const SEAM = '2px solid var(--card)'

export function pct(n: number, t: number): number {
  return t > 0 ? Math.round((n / t) * 100) : 0
}
