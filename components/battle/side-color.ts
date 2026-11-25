import type { BattleSideKey } from '@/lib/rows'

import { COLOR } from '@/components/colors'

export const SIDE_COLOR: Record<BattleSideKey, string> = {
  attacker: COLOR.red,
  defender: COLOR.blue,
}
