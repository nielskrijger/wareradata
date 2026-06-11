'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { UserRow } from '@/lib/rows'

import { ReadinessBadge } from '@/components/badges/readiness-badge'
import { CombatModeCell } from '@/components/cells/combat-mode-cell'
import { MUCell } from '@/components/cells/mu-cell'
import { PartyCell } from '@/components/cells/party-cell'
import { UserNameCell } from '@/components/cells/user-name-cell'
import { ValueWithRankTooltip } from '@/components/cells/value-with-rank-tooltip'
import { WareraLinkIcon } from '@/components/cells/warera-link-icon'
import { buildColumns } from '@/components/data-table/column-categories'
import {
  compactNumberColumn,
  countryColumn,
  dateColumn,
  gearColumn,
  localeNumberColumn,
  percentBarColumn,
  pointsBreakdownColumn,
  rankTooltipColumn,
} from '@/components/data-table/column-factories'
import { InfoTooltip } from '@/components/info-tooltip'
import { RelativeTime } from '@/components/relative-time'
import { Badge } from '@/components/ui/badge'
import { UserHoverCard } from '@/components/user-hover-card'

export type { UserRow }

export const userColumns: ColumnDef<UserRow>[] = buildColumns<UserRow>(
  {
    accessorKey: 'username',
    header: 'User',
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-2">
        <UserHoverCard userId={row.original.id}>
          <UserNameCell userId={row.original.id} name={row.original.username} avatarUrl={row.original.avatarUrl} colorScheme={row.original.colorScheme} />
        </UserHoverCard>
        {row.original.isBanned && <Badge className="shrink-0 bg-red-500/15 text-red-900 dark:text-red-300">banned</Badge>}
        <WareraLinkIcon kind="user" id={row.original.id} />
      </div>
    ),
    meta: { width: 250 },
  },
  {
    points: [
      pointsBreakdownColumn<UserRow>('points', 'Points', { width: 105, tooltip: 'Ranking points: level + damage + wealth combined.' }),
      {
        accessorKey: 'pointsPerDay',
        header: 'Per day',
        cell: ({ row }) => {
          const ppd = row.original.pointsPerDay
          if (ppd !== null) {
            return ppd.toLocaleString()
          }
          const created = row.original.createdAt
          const hasValidJoinDate = !!created && !created.startsWith('0000')
          if (hasValidJoinDate) {
            return (
              <InfoTooltip
                label="N/A"
                hint="Account is less than 7 days old; per-day rate isn't meaningful yet."
                className="text-muted-foreground cursor-default"
              />
            )
          }
          return null
        },
        sortDescFirst: true,
        meta: { heat: 'median', align: 'right', width: 110, tooltip: 'Average points earned per day since joining.' },
      },
    ],
    general: [
      countryColumn<UserRow>({ sortKey: 'countryCode' }),
      {
        accessorKey: 'levelRank',
        header: 'Level',
        cell: ({ row }) => (
          <ValueWithRankTooltip rank={row.original.levelRank}>
            {row.original.level ?? null}
          </ValueWithRankTooltip>
        ),
        sortDescFirst: false,
        sortUndefined: 'last',
        meta: { heat: 'invert', sortInvert: true, align: 'right', width: 90 },
      },
      {
        accessorKey: 'muName',
        header: 'MU',
        cell: ({ row }) => (
          <MUCell muName={row.original.muName} muId={row.original.muId} avatarUrl={row.original.muAvatarUrl} />
        ),
        meta: { width: 200 },
      },
      {
        accessorKey: 'partyName',
        header: 'Party',
        cell: ({ row }) => (
          <PartyCell
            partyName={row.original.partyName}
            partyId={row.original.partyId}
            avatarUrl={row.original.partyAvatarUrl}
          />
        ),
        meta: { width: 200 },
      },
      {
        accessorKey: 'lastConnectionAt',
        header: 'Last seen',
        cell: ({ row }) => (
          <RelativeTime iso={row.original.lastConnectionAt} className="text-muted-foreground" />
        ),
        sortDescFirst: true,
        meta: { width: 110 },
      },
      dateColumn<UserRow>('createdAt', 'Joined'),
    ],
    combat: [
      percentBarColumn<UserRow>('healthPercent', 'Health', { width: 120 }),
      percentBarColumn<UserRow>('hungerPercent', 'Hunger', { width: 120 }),
      gearColumn<UserRow>('gearScore', 'Gear'),
      {
        // Sorts on the buff/debuff time remaining (see readinessSortValue in the
        // API route): descending — the default first click — puts the longest buff
        // on top, "ready" in the middle, and the longest debuff at the bottom.
        accessorKey: 'readinessStatus',
        header: 'Buff',
        cell: ({ row }) => <ReadinessBadge status={row.original.readinessStatus} endsAt={row.original.readinessEndsAt} />,
        sortDescFirst: true,
        meta: { width: 100 },
      },
      {
        // Sorts on warShare (the war/eco distribution), not the combatMode label:
        // first click puts the most war-leaning players on top, pure-eco last,
        // untrained (null share) trailing. Point totals scale with level, so the
        // ratio is what's meaningful here.
        accessorKey: 'warShare',
        header: 'Skills',
        cell: ({ row }) => (
          <CombatModeCell
            mode={row.original.combatMode}
            warPoints={row.original.warPoints}
            ecoPoints={row.original.ecoPoints}
            warPointsRank={row.original.warPointsRank}
            ecoPointsRank={row.original.ecoPointsRank}
          />
        ),
        sortDescFirst: true,
        meta: { width: 110 },
      },
      rankTooltipColumn<UserRow>('damage', 'damageRank', 'Total', { width: 90 }),
      compactNumberColumn<UserRow>('weeklyDamage', 'Weekly', { heat: 'median', width: 110 }),
      {
        accessorKey: 'militaryRank',
        header: 'Mil. Rank',
        cell: ({ row }) => row.original.militaryRank ?? null,
        sortDescFirst: true,
        meta: { heat: 'median', align: 'right', width: 120 },
      },
      localeNumberColumn<UserRow>('terrain', 'Terrain', { heat: 'median', width: 105 }),
    ],
    wealth: [
      rankTooltipColumn<UserRow>('wealth', 'wealthRank', 'Total', { width: 100, tooltip: 'Total wealth: companies + items + cash + equipment + weapons.' }),
      compactNumberColumn<UserRow>('companiesWealth', 'Companies', { heat: 'median', width: 135, tooltip: 'Value of companies owned.' }),
      compactNumberColumn<UserRow>('itemsWealth', 'Items', { heat: 'median', width: 100, tooltip: 'Value of items held.' }),
      compactNumberColumn<UserRow>('cashWealth', 'Cash', { heat: 'median', width: 100, tooltip: 'Liquid cash on hand.' }),
      compactNumberColumn<UserRow>('equipmentWealth', 'Equipment', { heat: 'median', width: 130, tooltip: 'Value of equipment owned.' }),
      compactNumberColumn<UserRow>('weaponsWealth', 'Weapons', { heat: 'median', width: 125, tooltip: 'Value of weapons owned.' }),
      compactNumberColumn<UserRow>('bounty', 'Bounty', { heat: 'median', width: 110, tooltip: 'Coins this player has put up as a battle bounty, paid to fighters per 1k damage dealt.' }),
      localeNumberColumn<UserRow>('referrals', 'Referrals', { heat: 'ramp', width: 120, tooltip: 'Players this user has referred.' }),
    ],
    premium: [
      localeNumberColumn<UserRow>('premiumMonths', 'Premium Mo.', { heat: 'ramp', width: 145 }),
      localeNumberColumn<UserRow>('premiumGifts', 'Premium Gifts', { heat: 'ramp', width: 155 }),
      localeNumberColumn<UserRow>('casesOpened', 'Cases Opened', { heat: 'median', logScale: true, width: 155 }),
      localeNumberColumn<UserRow>('gemsPurchased', 'Gems Purchased', { heat: 'ramp', width: 175 }),
    ],
  },
)
