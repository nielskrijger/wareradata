import type { BattleSideKey } from '@/lib/rows'

import { SIDE_COLOR } from './side-color'

export function SideDot({ side }: { side: BattleSideKey }) {
  return <span className="size-2 shrink-0 rounded-full" style={{ background: SIDE_COLOR[side] }} />
}
