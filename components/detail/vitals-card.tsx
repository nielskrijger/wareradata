import { Drumstick, Heart } from 'lucide-react'

import { StackedBar } from '@/components/stacked-bar'
import { heatColor } from '@/lib/utils'

interface Props {
  // 0-100 readings; a player's own values, or a member average per entity.
  health: number | null
  hunger: number | null
  // Prefix the labels with "Avg" — the MU / country cards show member averages,
  // the user card shows the player's own values.
  average?: boolean
}

/**
 * Detail-page card pairing health and hunger in one block (replacing the two
 * separate VitalCards). Each reading is an icon-led row whose percent and bar
 * are heat-tinted red->green by value. Rows with a null value are skipped; the
 * card renders nothing when both are null.
 */
export function VitalsCard({ health, hunger, average }: Props) {
  if (health == null && hunger == null) {
    return null
  }
  return (
    <div className="bg-card flex flex-col gap-3 rounded-md border p-3">
      <span className="text-xs font-medium">Vitals</span>
      <Row label={`${average ? 'Avg ' : ''}Health`} icon={<Heart className="size-4" />} value={health} />
      <Row label={`${average ? 'Avg ' : ''}Hunger`} icon={<Drumstick className="size-4" />} value={hunger} />
    </div>
  )
}

function Row({ label, icon, value }: {
  label: string
  icon: React.ReactNode
  value: number | null
}) {
  if (value == null) {
    return null
  }
  const color = heatColor(value)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color }}>
          {icon}
          {label}
        </span>
        <span className="tabular-nums" style={{ color }}>
          {value}
          %
        </span>
      </div>
      <StackedBar
        className="bg-muted h-1.5 w-full"
        total={100}
        segments={[{ key: 'value', value, color }]}
      />
    </div>
  )
}
