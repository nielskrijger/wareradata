import type { RankMapRow } from '@/components/detail/rank-map'

import { CompactNumber } from '@/components/cells/compact-number'

// Its own file because Fast Refresh needs component files to export only components.

/**
 * A row, compact for the big skewed stats (damage, gold) and plain for small counts.
 */
export function rankRow(label: string, value: number | null, rank: number | null, compact = false): RankMapRow {
  return { label, value, rank, display: compact ? <CompactNumber value={value} /> : undefined }
}
