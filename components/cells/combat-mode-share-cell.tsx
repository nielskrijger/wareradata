'use client'

import { Coins, Swords } from 'lucide-react'

import { EmptyDash } from '@/components/empty-dash'
import { StackedBar } from '@/components/stacked-bar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  // Mean of members' war shares (0 = pure eco … 1 = pure war), or null when no
  // members have trained war or eco. Aggregated on the MU / country row.
  avgWarShare: number | null
  // Bar track width. Defaults to 84px to sit inside the Mode column.
  width?: number
}

// Shared heat tokens so war/eco read as one consistent red/green across the
// table cells and the detail-page card (which also uses --heat-red/green).
const WAR_COLOR = 'var(--heat-red)' // red (combat)
const ECO_COLOR = 'var(--heat-green)' // green (growth)

/**
 * A MU / country's collective War / Eco lean as a two-tone bar (red war / green
 * eco), sized by the mean of members' war shares. A bar rather than a single
 * badge: the aggregate mean rarely crosses the War threshold, so almost every
 * group would read "Eco" as a chip — the bar shows the actual split at a glance.
 * Hover reveals the exact percentages. Mirrors {@link ReadinessPillBar}.
 *
 * The per-user cell keeps the badge — individual players genuinely span the
 * War/Eco/Hybrid range, so the label is informative there.
 */
export function CombatModeShareCell({ avgWarShare, width = 84 }: Props) {
  if (avgWarShare === null) {
    return <EmptyDash />
  }
  const warPct = Math.round(avgWarShare * 100)
  const ecoPct = 100 - warPct
  return (
    <Tooltip>
      <TooltipTrigger
        render={(
          // Pad vertically so the hover/hit area covers the row height, not just
          // the 1.5px-tall bar (matching ReadinessPillBar).
          <div className="flex cursor-default items-center py-2" style={{ width }}>
            <StackedBar
              className="h-1.5 w-full bg-white/10"
              segments={[
                { key: 'war', value: warPct, color: WAR_COLOR },
                { key: 'eco', value: ecoPct, color: ECO_COLOR },
              ]}
            />
          </div>
        )}
      />
      <TooltipContent side="top" className="w-48 px-3 py-2">
        <div className="mb-2 font-medium">Avg member lean</div>
        <dl className="space-y-1.5">
          <LeanRow label="War" pct={warPct} color={WAR_COLOR} icon={<Swords className="size-3 shrink-0" style={{ color: WAR_COLOR }} />} />
          <LeanRow label="Eco" pct={ecoPct} color={ECO_COLOR} icon={<Coins className="size-3 shrink-0" style={{ color: ECO_COLOR }} />} />
        </dl>
      </TooltipContent>
    </Tooltip>
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
