import type { BattleSideKey } from '@/lib/rows'

export const SIDE_COLOR: Record<BattleSideKey, string> = {
  attacker: 'var(--heat-red)',
  defender: 'var(--heat-blue)',
}
