/**
 * Where a rank sits on a rank track, 0 (last) to 100 (#1).
 *
 * Square root of the share of the set ranked above: the top quarter gets half
 * the track, so the best spread out without the top 1% swallowing it. Being a
 * share, groups and players of different set sizes line up.
 */
export function rankPosition(rank: number, total: number): number {
  return sharePosition((rank - 1) / Math.max(total - 1, 1))
}

function sharePosition(share: number): number {
  return 100 * (1 - Math.sqrt(share))
}

export const RANK_MARKS = [
  { label: 'last', at: 0 },
  { label: 'top 25%', at: sharePosition(0.25) },
  { label: 'top 6%', at: sharePosition(0.0625) },
  { label: 'top 1%', at: sharePosition(0.01) },
  { label: '#1', at: 100 },
]

/**
 * Where a value sits on a value track, 0 (none) to 100 (`max`, the #1's).
 *
 * Square root of the share of #1's value, like {@link rankPosition}: the
 * leaders spread out without the long tail of small ones collapsing to a dot.
 */
export function valuePosition(value: number, max: number): number {
  return max > 0 ? 100 * Math.sqrt(Math.max(value, 0) / max) : 0
}

/**
 * The share of #1's value at a spot on a value track; {@link valuePosition} undone.
 */
export function valueShare(at: number): number {
  return (at / 100) ** 2
}

export const VALUE_MARKS = [
  { label: '0', at: 0 },
  { label: '10% of #1', at: valuePosition(0.1, 1) },
  { label: '25%', at: valuePosition(0.25, 1) },
  { label: '50%', at: valuePosition(0.5, 1) },
  { label: '#1', at: 100 },
]
