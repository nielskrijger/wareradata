import type { ActiveBattleSummary } from '@/lib/rows'

import { BattleCountBadge } from '@/components/badges/battle-count-badge'
import { CountryHoverCard } from '@/components/country-hover-card'
import { EmptyDash } from '@/components/empty-dash'
import { Flag } from '@/components/flag'
import { InternalLink } from '@/components/links'

interface Props {
  countryCode: string | null
  countryName: string | null
  countryId: string | null
  /**
   * Active-battle count; when > 0 a small ⚔ pill is shown after the name.
   * Omit (or pass 0) to hide it, e.g. on the /battles page where it'd be
   * redundant next to the battle itself.
   */
  activeBattles?: number
  // Matchups behind `activeBattles`, shown in the pill's hover tooltip.
  activeBattlesList?: ActiveBattleSummary[]
}

/**
 * Country cell shared by /users, /countries, /mus, /parties, /regions, and the
 * detail headers. The flag + name link to the country detail page. For the
 * warera.io link, use the dedicated trailing "WarEra" column on each table.
 */
export function CountryCell({ countryCode, countryName, countryId, activeBattles, activeBattlesList }: Props) {
  if (!countryCode && !countryName) {
    return <EmptyDash />
  }
  const label = countryName ?? countryCode ?? ''
  return (
    <div className="flex min-w-0 items-center gap-2">
      {/* Only the flag + name trigger the hover-card; the battle pill stays
          outside it so its own tooltip doesn't nest inside this one. */}
      <CountryHoverCard countryId={countryId} triggerClassName="block min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <Flag code={countryCode} />
          {countryId
            ? (
                <InternalLink href={`/countries/${countryId}`} title={label} className="truncate">
                  {label}
                </InternalLink>
              )
            : (
                <span className="truncate">{label}</span>
              )}
        </span>
      </CountryHoverCard>
      {activeBattles != null && (
        <BattleCountBadge
          count={activeBattles}
          countryId={countryId ?? undefined}
          battles={activeBattlesList}
        />
      )}
    </div>
  )
}
