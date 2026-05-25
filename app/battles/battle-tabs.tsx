'use client'

import type { PageResult } from '@/components/data-table/data-table'
import type { BattleRow } from '@/lib/rows'

import { parseAsString, parseAsStringEnum, useQueryState, useQueryStates } from 'nuqs'

import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'

import { BattlesTable } from './battles-table'
import { activeBattleColumns, finishedBattleColumns } from './columns'

const TABS = ['active', 'finished'] as const
type Tab = (typeof TABS)[number]

interface Props {
  active: PageResult<BattleRow>
  finished: PageResult<BattleRow>
}

/**
 * The /battles page's two scoped tables behind Active / Finished tabs.
 *
 * Same rationale as the country page: both tables read the same
 * `q`/`sort`/`dir`/`page` URL keys, so only the active one is mounted (base-ui
 * unmounts hidden panels), and switching tabs clears those keys so a leftover
 * `?page=2` doesn't bleed across. The two tables also use different columns
 * (live round damage vs. winner/ended), so they can't share a single table.
 */
export function BattleTabs({ active, finished }: Props) {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum([...TABS]).withDefault('active').withOptions({ shallow: true, history: 'replace' }),
  )
  const [, setTableState] = useQueryStates(
    { q: parseAsString, sort: parseAsString, dir: parseAsString, page: parseAsString },
    { shallow: true, history: 'replace' },
  )

  function selectTab(next: Tab) {
    setTableState({ q: null, sort: null, dir: null, page: null })
    setTab(next)
  }

  return (
    <Tabs value={tab} onValueChange={value => selectTab(value as Tab)}>
      <TabsList>
        <TabsTab value="active">{`Active (${active.total.toLocaleString()})`}</TabsTab>
        <TabsTab value="finished">Finished</TabsTab>
      </TabsList>

      <TabsPanel value="active" className="pt-4">
        <BattlesTable
          initial={active}
          columns={activeBattleColumns}
          baseFilter="isActive:true"
          initialSort={{ id: 'totalDamage', desc: true }}
        />
      </TabsPanel>
      <TabsPanel value="finished" className="pt-4">
        <BattlesTable
          initial={finished}
          columns={finishedBattleColumns}
          baseFilter="isActive:false"
          initialSort={{ id: 'endedAt', desc: true }}
        />
      </TabsPanel>
    </Tabs>
  )
}
