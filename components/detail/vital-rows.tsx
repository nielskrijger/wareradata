import { Drumstick, Heart } from 'lucide-react'

import { StackedBar } from '@/components/stacked-bar'
import { heatColor, heatTextColor } from '@/lib/utils'

/**
 * Health and hunger as heat-tinted rows with bars.
 */
export function VitalRows({ health, hunger }: { health: number | null, hunger: number | null }) {
  return (
    <>
      <VitalRow label="Health" icon={<Heart className="size-4" />} value={health} />
      <VitalRow label="Hunger" icon={<Drumstick className="size-4" />} value={hunger} />
    </>
  )
}

/**
 * One heat-tinted reading with its bar.
 */
function VitalRow({ label, icon, value }: {
  label: string
  icon: React.ReactNode
  value: number | null
}) {
  if (value == null) {
    return null
  }

  const color = heatColor(value)
  const textColor = heatTextColor(value)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: textColor }}>
          {icon}
          {label}
        </span>
        <span className="tabular-nums" style={{ color: textColor }}>
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
