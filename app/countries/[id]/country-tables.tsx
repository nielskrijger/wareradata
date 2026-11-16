'use client'

import type { PageResult } from '@/components/data-table/data-table'
import type { BattleRow, MURow, PartyRow, UserRow } from '@/lib/rows'

import { parseAsString, parseAsStringEnum, useQueryState, useQueryStates } from 'nuqs'
import { useEffect, useRef } from 'react'

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
 * The country page's scoped tables, one at a time behind tabs.
 *
 * Every DataTable reads the same `q`/`sort`/`dir`/`page` URL keys, so only the
 * active one is mounted, and a tab switch clears the keys so `?page=2` from one
 * table doesn't carry into another.
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

  // Scroll to the tables only when a non-default tab arrives via the URL (a deep
  // link or the header's ⚔ pill); a click on a tab here sets skipScrollRef so
  // the page doesn't jump.
  const tablesRef = useRef<HTMLDivElement>(null)
  const skipScrollRef = useRef(false)

  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false

      return
    }

    if (tab === 'citizens') {
      return
    }

    tablesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [tab])

  function selectTab(next: Tab) {
    skipScrollRef.current = true
    // Drop the active table's paging/sort/filter so it doesn't bleed into the
    // table we're switching to.
    setTableState({ q: null, sort: null, dir: null, page: null })
    setTab(next)
  }

  return (
    <Tabs ref={tablesRef} value={tab} onValueChange={value => selectTab(value as Tab)} className="scroll-mt-20">
      <TabsList>
        <TabsTab value="citizens">Citizens</TabsTab>
        <TabsTab value="mus">MUs</TabsTab>
        <TabsTab value="parties">Parties</TabsTab>
        <TabsTab value="battles">{`Active Battles (${battles.total.toLocaleString()})`}</TabsTab>
      </TabsList>

      <TabsPanel value="citizens" className="pt-4">
        <UsersTable initial={citizens} baseFilter={`countryCode:${code}`} omitColumns={['countryCode']} />
      </TabsPanel>
      <TabsPanel value="mus" className="pt-4">
        <MUsTable initial={mus} baseFilter={`countryCode:${code}`} omitColumns={['countryName']} />
      </TabsPanel>
      <TabsPanel value="parties" className="pt-4">
        <PartiesTable initial={parties} baseFilter={`countryCode:${code}`} omitColumns={['countryName']} />
      </TabsPanel>
      <TabsPanel value="battles" className="pt-4">
        <BattlesTable
          tableId="battles-active"
          initial={battles}
          columns={activeBattleColumns}
          baseFilter={`isActive:true AND (attackerCode:${code} OR defenderCode:${code})`}
          initialSort={{ id: 'totalDamage', desc: true }}
        />
      </TabsPanel>
    </Tabs>
  )
}
