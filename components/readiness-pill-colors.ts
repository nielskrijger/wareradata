// Buff = green, ready = sky-blue, debuff = red, all from the shared --heat-*
// tokens so good / neutral / bad read consistently across the app (war/eco,
// damage, readiness). The tokens are theme-aware and still legible on the dark
// tooltip; a thin card-coloured seam separates adjacent segments.
export const GREEN = 'var(--heat-green)'
export const SKY = 'var(--heat-blue)'
export const RED = 'var(--heat-red)'
export const SEAM = '2px solid var(--card)'

export function pct(n: number, t: number): number {
  return t > 0 ? Math.round((n / t) * 100) : 0
}
