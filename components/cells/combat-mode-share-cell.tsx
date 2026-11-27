'use client'

import { Coins, Swords } from 'lucide-react'

import { StackedBarCell } from '@/components/cells/stacked-bar-cell'
import { TooltipHeading } from '@/components/cells/tooltip-ledger'
import { ECO_COLOR, WAR_COLOR } from '@/components/colors'
import { EmptyDash } from '@/components/empty-dash'

interface Props {
  /**
   * Mean of members' war shares (0 = pure eco … 1 = pure war), or null when no
   * members have trained war or eco. Aggregated on the MU / country row.
   */
  avgWarShare: number | null

  /**
   * Bar track width. Defaults to 84px to sit inside the Mode column.
   */
  width?: number
}

/**
 * A group's mean war/eco lean as a two-tone bar.
 *
 * A badge would read "Eco" for almost every group, since the mean rarely
 * crosses the War threshold; the bar shows the actual split.
 */
export function CombatModeShareCell({ avgWarShare, width = 84 }: Props) {
  if (avgWarShare === null) {
    return <EmptyDash />
  }

  const warPct = Math.round(avgWarShare * 100)
  const ecoPct = 100 - warPct

  return (
    <StackedBarCell
      width={width}
      tooltipClassName="w-48 px-3 py-2"
      segments={[
        { key: 'war', value: warPct, color: WAR_COLOR },
        { key: 'eco', value: ecoPct, color: ECO_COLOR },
      ]}
    >
      <TooltipHeading label="Avg member lean" />
      <dl className="space-y-1.5">
        <LeanRow
          label="War"
          pct={warPct}
          color={WAR_COLOR}
          icon={<Swords className="size-3 shrink-0" style={{ color: WAR_COLOR }} />}
        />
        <LeanRow
          label="Eco"
          pct={ecoPct}
          color={ECO_COLOR}
          icon={<Coins className="size-3 shrink-0" style={{ color: ECO_COLOR }} />}
        />
      </dl>
    </StackedBarCell>
  )
}

function LeanRow({ label, pct, color, icon }: { label: string, pct: number, color: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {icon}
      <span className="w-8">{label}</span>
      <div className="bg-white/10 h-1 flex-1 overflow-hidden rounded-full">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-9 text-right tabular-nums">
        {pct}
        %
      </span>
    </div>
  )
}
