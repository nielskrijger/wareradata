/**
 * The card-coloured gap and outline around a sidebar's avatar or flag.
 */
export function emblemRing(color = 'var(--border)'): string {
  return `0 0 0 3px var(--card), 0 0 0 4px ${color}`
}
