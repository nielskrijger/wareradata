'use client'

import type { ReactNode } from 'react'

import type { PagedResult } from '@/lib/query'
import type { BattleRow, MURow, PartyRow, UserRow } from '@/lib/rows'

import { Landmark, LayoutGrid, Shield, Swords, Users, Vote } from 'lucide-react'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import { useEffect, useRef } from 'react'

import { BattlesTable } from '@/app/battles/battles-table'
import { activeBattleColumns } from '@/app/battles/columns'
import { MUsTable } from '@/app/mus/mus-table'
import { PartiesTable } from '@/app/parties/parties-table'
import { UsersTable } from '@/app/users/users-table'
import { useClearTableUrlState } from '@/components/data-table/use-table-url-state'
import { FitTab, FitTabs } from '@/components/fit-tabs'

const TABS = ['overview', 'government', 'citizens', 'mus', 'parties', 'battles'] as const
type Tab = (typeof TABS)[number]

interface Props {
  code: string
  overview: ReactNode

  /**
   * Null for a country without a captured government, which then has no tab.
   */
  government: ReactNode | null
  citizens: PagedResult<UserRow>
  mus: PagedResult<MURow>
  parties: PagedResult<PartyRow>
  battles: PagedResult<BattleRow>
}

/**
 * The country page's main tabs: the rank map, the government, and the scoped
 * tables, one at a time.
 *
 * Every DataTable reads the same `q`/`sort`/`dir`/`page` URL keys, so only the
 * active one is mounted, and a tab switch clears the keys so `?page=2` from one
 * table doesn't carry into another.
 */
export function CountryTabs({ code, overview, government, citizens, mus, parties, battles }: Props) {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum([...TABS]).withDefault('overview').withOptions({ shallow: true, history: 'replace' }),
  )

  const clearTableState = useClearTableUrlState()

  // Scroll to the tabs only when a non-default tab arrives via the URL (a deep
  // link or the header's ⚔ pill); a click on a tab here sets skipScrollRef so
  // the page doesn't jump.
  const tabsRef = useRef<HTMLDivElement>(null)
  const skipScrollRef = useRef(false)

  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false

      return
    }

    if (tab === 'overview') {
      return
    }

    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [tab])

  function selectTab(next: string) {
    skipScrollRef.current = true
    clearTableState()
    void setTab(next as Tab)
  }

  const scope = `countryCode:${code}`

  return (
    <div ref={tabsRef} className="scroll-mt-20 space-y-4">
      <FitTabs value={tab} onChange={selectTab} ids={government ? [...TABS] : TABS.filter(t => t !== 'government')}>
        <FitTab value="overview" label="Overview" icon={<LayoutGrid />} />
        {government && <FitTab value="government" label="Government" icon={<Landmark />} />}
        <FitTab value="citizens" label="Citizens" icon={<Users />} count={citizens.total} />
        <FitTab value="mus" label="MUs" icon={<Shield />} count={mus.total} />
        <FitTab value="parties" label="Parties" icon={<Vote />} count={parties.total} />
        <FitTab value="battles" label="Battles" icon={<Swords />} count={battles.total} />
      </FitTabs>

      {tab === 'overview' && overview}
      {tab === 'government' && government}
      {tab === 'citizens' && <UsersTable initial={citizens} baseFilter={scope} omitColumns={['countryCode']} />}
      {tab === 'mus' && <MUsTable initial={mus} baseFilter={scope} omitColumns={['countryName']} />}
      {tab === 'parties' && <PartiesTable initial={parties} baseFilter={scope} omitColumns={['countryName']} />}
      {tab === 'battles' && (
        <BattlesTable
          tableId="battles-active"
          initial={battles}
          columns={activeBattleColumns}
          baseFilter={`isActive:true AND (attackerCode:${code} OR defenderCode:${code})`}
          initialSort={{ id: 'totalDamage', desc: true }}
        />
      )}
    </div>
  )
}
