import type { BattleDetail, BattleFighter, BattleRow, BattleSideKey } from '@/lib/rows'

import { SIDE_COLOR } from '@/components/battle/side-color'
import { SideDot } from '@/components/battle/side-dot'
import { CompactNumber } from '@/components/cells/compact-number'
import { EntityCell } from '@/components/cells/entity-cell'
import { SectionHeading } from '@/components/detail/section-heading'
import { StackedBar } from '@/components/stacked-bar'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'

interface LeaderboardProps {
  list: BattleFighter[]
  side: BattleSideKey
  max: number
}

function Leaderboard({ list, side, max }: LeaderboardProps) {
  if (!list.length) {
    return <p className="text-muted-foreground text-sm">Nobody yet</p>
  }

  return (
    <ol className="space-y-2.5">
      {list.map((f, i) => (
        <li key={f.id ?? f.name ?? f.value} className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground w-5 text-right text-xs tabular-nums">{i + 1}</span>
            <div className="min-w-0 flex-1"><EntityCell entity={f} /></div>
            <span className="tabular-nums"><CompactNumber value={f.value} /></span>
          </div>
          <StackedBar
            className="bg-muted ml-7 h-1"
            total={max}
            segments={[{ key: 'value', value: f.value, color: SIDE_COLOR[side] }]}
          />
        </li>
      ))}
    </ol>
  )
}

const TABS = [
  { value: 'players', label: 'Players' },
  { value: 'mus', label: 'MUs' },
  { value: 'countries', label: 'Countries' },
  { value: 'earners', label: 'Bounty earned' },
] as const

/**
 * Top damage dealers per side, one tab per kind. Bars share a scale across
 * both sides, so a lopsided battle looks lopsided.
 */
export function BattleLeaderboards({ battle, detail }: { battle: BattleRow, detail: BattleDetail }) {
  const hasEarners = detail.earners.attacker.length > 0 || detail.earners.defender.length > 0
  const tabs = TABS.filter(t => t.value !== 'earners' || hasEarners)

  return (
    <Tabs defaultValue="players">
      <TabsList>
        {tabs.map(t => <TabsTab key={t.value} value={t.value}>{t.label}</TabsTab>)}
      </TabsList>
      {tabs.map(({ value }) => {
        const lists = detail[value]
        const max = Math.max(lists.attacker[0]?.value ?? 0, lists.defender[0]?.value ?? 0)

        return (
          <TabsPanel key={value} value={value} className="grid gap-6 pt-4 md:grid-cols-2">
            {(['attacker', 'defender'] as const).map(side => (
              <div key={side} className="min-w-0 space-y-3">
                <SectionHeading title={battle[side].name ?? '?'} aside={<SideDot side={side} />} />
                <Leaderboard list={lists[side]} side={side} max={max} />
              </div>
            ))}
          </TabsPanel>
        )
      })}
    </Tabs>
  )
}
