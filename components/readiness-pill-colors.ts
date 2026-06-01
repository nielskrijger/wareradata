// Buff = green, ready = slate, debuff = red, all from the shared --heat-* tokens
// so good / neutral / bad read consistently across the app (war/eco, damage,
// readiness). Ready uses a neutral grey (--heat-slate = the gear common-tier
// #a3a3a3) rather than a saturated blue, so the neutral state reads calmer
// beside the green/red and shares the gear pill's "neutral" language. The
// tokens are theme-aware and still legible on the dark tooltip; a thin
// card-coloured seam separates adjacent segments.
export const GREEN = 'var(--heat-green)'
export const SLATE = 'var(--heat-slate)'
export const RED = 'var(--heat-red)'
export const SEAM = '2px solid var(--card)'

export function pct(n: number, t: number): number {
  return t > 0 ? Math.round((n / t) * 100) : 0
}
