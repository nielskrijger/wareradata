'use client'

import type { PagedResult } from '@/lib/query'
import type { BattleRow } from '@/lib/rows'

import { parseAsStringEnum, useQueryState } from 'nuqs'

import { useClearTableUrlState } from '@/components/data-table/use-table-url-state'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'

import { formatNumber } from '@/lib/format'
import { BattlesTable } from './battles-table'
import { activeBattleColumns, finishedBattleColumns } from './columns'

const TABS = ['active', 'finished'] as const
type Tab = (typeof TABS)[number]

interface Props {
  active: PagedResult<BattleRow>
  finished: PagedResult<BattleRow>
}

/**
 * Active and finished battles behind tabs.
 *
 * Both tables read the same URL keys, so only the active one is mounted and a
 * tab switch clears the keys (see CountryTabs).
 */
export function BattleTabs({ active, finished }: Props) {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum([...TABS]).withDefault('active').withOptions({ shallow: true, history: 'replace' }),
  )

  const clearTableState = useClearTableUrlState()

  function selectTab(next: Tab) {
    clearTableState()
    setTab(next)
  }

  return (
    <Tabs value={tab} onValueChange={value => selectTab(value as Tab)}>
      <TabsList>
        <TabsTab value="active">{`Active (${formatNumber(active.total)})`}</TabsTab>
        <TabsTab value="finished">Finished</TabsTab>
      </TabsList>

      <TabsPanel value="active" className="pt-4">
        <BattlesTable
          tableId="battles-active"
          initial={active}
          columns={activeBattleColumns}
          baseFilter="isActive:true"
          initialSort={{ id: 'totalDamage', desc: true }}
        />
      </TabsPanel>
      <TabsPanel value="finished" className="pt-4">
        <BattlesTable
          tableId="battles-finished"
          initial={finished}
          columns={finishedBattleColumns}
          baseFilter="isActive:false"
          initialSort={{ id: 'endedAt', desc: true }}
        />
      </TabsPanel>
    </Tabs>
  )
}
