'use client'

import type { PageResult } from '@/components/data-table/data-table'
import type { BattleRow, MURow, PartyRow, UserRow } from '@/lib/rows'

import { parseAsString, parseAsStringEnum, useQueryState, useQueryStates } from 'nuqs'

import { BattlesTable } from '@/app/battles/battles-table'
import { activeBattleColumns } from '@/app/battles/columns'
import { MUsTable } from '@/app/mus/mus-table'
import { PartiesTable } from '@/app/parties/parties-table'
import { UsersTable } from '@/app/users/users-table'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'

const TABS = ['citizens', 'mus', 'parties', 'battles'] as const
type Tab = (typeof TABS)[number]

interface Props {
  code: string
  citizens: PageResult<UserRow>
  mus: PageResult<MURow>
  parties: PageResult<PartyRow>
  battles: PageResult<BattleRow>
}

/**
 * The country page's three scoped tables, shown one at a time behind tabs.
 *
 * Each DataTable reads the same `q`/`sort`/`dir`/`page` URL keys, so mounting
 * more than one at once makes them fight over the same paging state. Tabs side-
 * step that: only the active table is mounted (base-ui unmounts hidden panels).
 * Switching tabs clears those table keys so a leftover `?page=2` from one table
 * doesn't carry into another with a different row count.
 */
export function CountryTables({ code, citizens, mus, parties, battles }: Props) {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum([...TABS]).withDefault('citizens').withOptions({ shallow: true, history: 'replace' }),
  )
  const [, setTableState] = useQueryStates(
    { q: parseAsString, sort: parseAsString, dir: parseAsString, page: parseAsString },
    { shallow: true, history: 'replace' },
  )

  function selectTab(next: Tab) {
    // Drop the active table's paging/sort/filter so it doesn't bleed into the
    // table we're switching to.
    setTableState({ q: null, sort: null, dir: null, page: null })
    setTab(next)
  }

  return (
    <Tabs value={tab} onValueChange={value => selectTab(value as Tab)}>
      <TabsList>
        <TabsTab value="citizens">Citizens</TabsTab>
        <TabsTab value="mus">Military Units</TabsTab>
        <TabsTab value="parties">Parties</TabsTab>
        <TabsTab value="battles">{`Active Battles (${battles.total.toLocaleString()})`}</TabsTab>
      </TabsList>

      <TabsPanel value="citizens" className="pt-4">
        <UsersTable initial={citizens} baseFilter={`countryCode:${code}`} />
      </TabsPanel>
      <TabsPanel value="mus" className="pt-4">
        <MUsTable initial={mus} baseFilter={`countryCode:${code}`} />
      </TabsPanel>
      <TabsPanel value="parties" className="pt-4">
        <PartiesTable initial={parties} baseFilter={`countryCode:${code}`} />
      </TabsPanel>
      <TabsPanel value="battles" className="pt-4">
        <BattlesTable
          initial={battles}
          columns={activeBattleColumns}
          baseFilter={`isActive:true AND (attackerCode:${code} OR defenderCode:${code})`}
          initialSort={{ id: 'totalDamage', desc: true }}
        />
      </TabsPanel>
    </Tabs>
  )
}
