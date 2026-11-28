'use client'

import type { PagedResult } from '@/lib/query'
import type { BattleRow } from '@/lib/rows'

import { History, Swords } from 'lucide-react'

import { useTableTabs } from '@/components/data-table/use-table-url-state'
import { FitTab, FitTabs } from '@/components/fit-tabs'

import { BattlesTable } from './battles-table'
import { activeBattleColumns, finishedBattleColumns } from './columns'

const TABS = ['active', 'finished'] as const

interface Props {
  active: PagedResult<BattleRow>
  finished: PagedResult<BattleRow>
}

/**
 * Active and finished battles behind tabs.
 */
export function BattleTabs({ active, finished }: Props) {
  const [tab, setTab] = useTableTabs(TABS)

  return (
    <div className="space-y-4">
      <FitTabs value={tab} onChange={setTab} ids={[...TABS]}>
        <FitTab value="active" label="Active" icon={<Swords />} count={active.total} />
        <FitTab value="finished" label="Finished" icon={<History />} />
      </FitTabs>

      {tab === 'active' && (
        <BattlesTable
          tableId="battles-active"
          initial={active}
          columns={activeBattleColumns}
          baseFilter="isActive:true"
          initialSort={{ id: 'totalDamage', desc: true }}
        />
      )}
      {tab === 'finished' && (
        <BattlesTable
          tableId="battles-finished"
          initial={finished}
          columns={finishedBattleColumns}
          baseFilter="isActive:false"
          initialSort={{ id: 'endedAt', desc: true }}
        />
      )}
    </div>
  )
}
