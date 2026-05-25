import type { ActiveBattleSummary } from '@/lib/rows'

import { Swords } from 'lucide-react'
import Link from 'next/link'

import { Flag } from '@/components/flag'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  count: number
  // Country id; when given the pill links to that country's active-battles tab.
  countryId?: string
  // The matchups behind `count`, rendered in the hover tooltip. Omit to show a
  // pill with no hover detail.
  battles?: ActiveBattleSummary[]
}

function battleLabel(b: ActiveBattleSummary): string {
  if (b.isTournament) {
    return 'Tournament'
  }
  return b.isResistance ? 'Resistance' : 'War'
}

/**
 * Small pill shown after an entity name when it's in active battles (e.g.
 * "⚔ 2" after a country). Rendered by entity cells like CountryCell when a
 * positive count is passed; nothing renders for zero so peaceful entities stay
 * clean. Styled like the "banned" pill: tinted, shrink-0 so it never squashes.
 *
 * When a countryId is given the pill links to that country's active-battles
 * tab; when a `battles` list is given, hovering opens a tooltip of the
 * matchups. The list is embedded by the server (it already has the live data
 * for the count), so there's no client fetch. Without either it's a plain,
 * non-interactive pill with a native title.
 */
export function BattleCountBadge({ count, countryId, battles }: Props) {
  if (count <= 0) {
    return null
  }

  const summary = `In ${count} active ${count === 1 ? 'battle' : 'battles'}`

  // Nothing to link or hover: a plain pill with a native title.
  if (!countryId) {
    return (
      <Badge
        className="bg-red-500/15 text-red-800 shrink-0 gap-0.5 dark:text-red-300"
        title={summary}
      >
        <Swords className="size-3" />
        {count.toLocaleString()}
      </Badge>
    )
  }

  const pill = (
    <Link
      href={`/countries/${countryId}?tab=battles`}
      aria-label={summary}
      className="shrink-0"
    >
      <Badge className="bg-red-500/15 text-red-800 gap-0.5 hover:bg-red-500/25 dark:text-red-300">
        <Swords className="size-3" />
        {count.toLocaleString()}
      </Badge>
    </Link>
  )

  // Linkable but no matchup list to show: skip the tooltip wrapper.
  if (!battles?.length) {
    return pill
  }

  return (
    <Tooltip>
      <TooltipTrigger render={pill} />
      <TooltipContent side="top" className="max-w-72 p-0">
        <div className="border-b border-neutral-50/20 px-3 py-1.5 font-medium">
          {summary}
        </div>
        <ul className="max-h-64 overflow-auto py-1">
          {battles.map(b => (
            <li key={b.id}>
              <Link
                href={`/battles/${b.id}`}
                className="flex items-center gap-2 px-3 py-1 hover:bg-neutral-50/15"
              >
                {b.opponentCode && <Flag code={b.opponentCode} className="shrink-0" />}
                <span className="min-w-0 truncate">
                  {b.opponentName ?? 'Unknown'}
                </span>
                <span className="ml-auto shrink-0 whitespace-nowrap text-neutral-50/60">
                  {battleLabel(b)}
                  {b.regionName ? ` · ${b.regionName}` : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}
