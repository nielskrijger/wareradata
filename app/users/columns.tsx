'use client'

import type { ColumnDef } from '@/components/data-table/features'

import type { UserRow } from '@/lib/rows'

import { ReadinessBadge } from '@/components/badges/readiness-badge'
import { RED_BADGE } from '@/components/badges/tone'
import { CombatModeCell } from '@/components/cells/combat-mode-cell'
import { GroupCell } from '@/components/cells/group-cell'
import { IdentityCell } from '@/components/cells/identity-cell'
import { LevelCell } from '@/components/cells/level-cell'
import { UserNameCell } from '@/components/cells/user-name-cell'
import { buildColumns } from '@/components/data-table/column-categories'
import {
  compactNumberColumn,
  countryColumn,
  dateColumn,
  gearColumn,
  localeNumberColumn,
  percentBarColumn,
  percentColumn,
  pointsBreakdownColumn,
  rankTooltipColumn,
} from '@/components/data-table/column-factories'
import { casesColumns } from '@/components/data-table/column-groups'
import { InfoTooltip } from '@/components/info-tooltip'
import { RelativeTime } from '@/components/relative-time'
import { Badge } from '@/components/ui/badge'
import { UserHoverCard } from '@/components/user-hover-card'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

export type { UserRow }

export const userColumns: ColumnDef<UserRow>[] = buildColumns<UserRow>(
  {
    accessorKey: 'username',
    header: 'User',
    cell: ({ row }) => (
      <IdentityCell kind="user" id={row.original.id}>
        <UserHoverCard userId={row.original.id}>
          <UserNameCell
            userId={row.original.id}
            name={row.original.username}
            avatarUrl={row.original.avatarUrl}
            colorScheme={row.original.colorScheme}
            countryCode={row.original.countryCode}
          />
        </UserHoverCard>
        {row.original.isBanned && (
          <Badge className={cn(RED_BADGE, 'shrink-0')}>banned</Badge>
        )}
      </IdentityCell>
    ),
    meta: { width: 250 },
  },
  {
    points: [
      pointsBreakdownColumn<UserRow>('points', 'Points', {
        width: 105,
        tooltip: 'Ranking points: level + damage + wealth combined.',
        stats: row => [{ label: 'Avg / day', value: row.pointsPerDay }],
      }),
      {
        accessorKey: 'pointsPerDay',
        header: 'Per day',
        cell: ({ row }) => {
          const ppd = row.original.pointsPerDay
          if (ppd !== null) {
            return formatNumber(ppd)
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
        meta: {
          heat: 'median',
          align: 'right',
          width: 110,
          tooltip: 'Average points earned per day since joining.',
          hiddenByDefault: true,
        },
      },
    ],
    general: [
      // The flag on the avatar already shows the country.
      countryColumn<UserRow>({ sortKey: 'countryCode', hiddenByDefault: true }),
      {
        accessorKey: 'levelRank',
        header: 'Level',
        cell: ({ row }) => <LevelCell {...row.original} />,
        sortDescFirst: false,
        sortUndefined: 'last',
        meta: { heat: 'invert', sortInvert: true, width: 80, cellClassName: 'tabular-nums' },
      },
      {
        accessorKey: 'muName',
        header: 'MU',
        cell: ({ row }) => (
          <GroupCell
            kind="mu"
            name={row.original.muName}
            id={row.original.muId}
            avatarUrl={row.original.muAvatarUrl}
            iconOnly
          />
        ),
        meta: { width: 64 },
      },
      {
        accessorKey: 'partyName',
        header: 'Party',
        cell: ({ row }) => (
          <GroupCell
            kind="party"
            name={row.original.partyName}
            id={row.original.partyId}
            avatarUrl={row.original.partyAvatarUrl}
            iconOnly
          />
        ),
        meta: { width: 64 },
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
      // Rarely what people compare players on; the user page still shows it.
      dateColumn<UserRow>('createdAt', 'Joined', { hiddenByDefault: true }),
    ],
    combat: [
      percentBarColumn<UserRow>('health', 'Health', { width: 120 }),
      percentBarColumn<UserRow>('hunger', 'Hunger', { width: 120 }),
      gearColumn<UserRow>('gearScore', 'Gear'),
      {
        // Sorts on the buff/debuff time remaining (see readinessSortValue in the
        // API route): descending — the default first click — puts the longest buff
        // on top, "ready" in the middle, and the longest debuff at the bottom.
        accessorKey: 'readinessStatus',
        header: 'Buff',
        cell: ({ row }) => (
          <ReadinessBadge status={row.original.readinessStatus} endsAt={row.original.readinessEndsAt} />
        ),
        sortDescFirst: true,
        meta: { width: 100 },
      },
      {
        // Sorts on war share, not points: point totals scale with level.
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
      rankTooltipColumn<UserRow>('damage', 'damageRank', 'Total', { width: 90, rankLabel: 'Total damage' }),
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
      rankTooltipColumn<UserRow>('wealth', 'wealthRank', 'Total', {
        rankLabel: 'Wealth',
        width: 100,
        tooltip: 'Total wealth: companies + items + cash + equipment + weapons.',
      }),
      compactNumberColumn<UserRow>('companiesWealth', 'Companies', {
        heat: 'median',
        width: 135,
        tooltip: 'Value of companies owned.',
      }),
      compactNumberColumn<UserRow>('stockpileWealth', 'Stockpile', {
        heat: 'median',
        width: 120,
        tooltip: 'Value of items + cash + equipment + weapons.',
      }),
      compactNumberColumn<UserRow>('itemsWealth', 'Items', {
        heat: 'median',
        width: 100,
        tooltip: 'Value of items held.',
      }),
      compactNumberColumn<UserRow>('cashWealth', 'Cash', {
        heat: 'median',
        width: 100,
        tooltip: 'Liquid cash on hand.',
      }),
      compactNumberColumn<UserRow>('equipmentWealth', 'Equipment', {
        heat: 'median',
        width: 130,
        tooltip: 'Value of equipment owned.',
      }),
      compactNumberColumn<UserRow>('weaponsWealth', 'Weapons', {
        heat: 'median',
        width: 125,
        tooltip: 'Value of weapons owned.',
      }),
      compactNumberColumn<UserRow>('bounty', 'Bounty', {
        heat: 'median',
        width: 110,
        tooltip: 'Coins this player has put up as a battle bounty, paid to fighters per 1k damage dealt.',
      }),
      localeNumberColumn<UserRow>('referrals', 'Referrals', {
        heat: 'ramp',
        width: 120,
        tooltip: 'Players this user has referred.',
      }),
      localeNumberColumn<UserRow>('milestoneTiers', 'Milestones', {
        heat: 'ramp',
        width: 125,
        tooltip: 'Lifetime milestone tiers reached.',
      }),
      localeNumberColumn<UserRow>('skinsOwned', 'Skins', {
        heat: 'ramp',
        width: 100,
        tooltip: 'Skins this player owns.',
      }),
    ],
    factories: [
      localeNumberColumn<UserRow>('factoryCount', '# Factories', {
        heat: 'ramp',
        width: 130,
        tooltip: 'Number of factories this player owns.',
      }),
      compactNumberColumn<UserRow>('factoryNetPerDay', 'Total / day', {
        heat: 'median',
        width: 120,
        tooltip: 'Daily factory profit: automated engines + NPC employees, net of employee and manager wages.',
      }),
      compactNumberColumn<UserRow>('factoryEngineNetPerDay', 'Auto / day', {
        heat: 'median',
        width: 120,
        tooltip: 'Daily profit from this player\'s automated engines.',
      }),
      compactNumberColumn<UserRow>('factoryEmployeeNetPerDay', 'Employees / day', {
        heat: 'median',
        width: 155,
        tooltip: 'Daily profit from this player\'s NPC employees, after their wages and the managers\' wages.',
      }),
      compactNumberColumn<UserRow>('factoryPayrollPerDay', 'Payroll / day', {
        heat: 'invertMedian',
        width: 140,
        tooltip: 'Daily wages of this player\'s NPC employees and managers.',
      }),
      compactNumberColumn<UserRow>('factoryPpPerDay', 'PP / day', {
        heat: 'median',
        width: 110,
        tooltip: 'Production points produced per day across this player\'s factories.',
      }),
      percentColumn<UserRow>('factoryEfficiencyPct', 'Efficiency', {
        heat: 'median',
        decimals: 0,
        width: 115,
        tooltip: 'Net as a share of the Top potential (the same production on the most profitable item). 100% = already on the best item.',
      }),
    ],
    employees: [
      localeNumberColumn<UserRow>('factoryWorkers', '# Employees', {
        heat: 'ramp',
        width: 135,
        tooltip: 'NPC employees across this player\'s factories.',
      }),
      compactNumberColumn<UserRow>('employeeAvgPpPerDay', 'Avg PP / day', {
        heat: 'median',
        width: 135,
        tooltip: 'Production points per employee per day.',
      }),
      compactNumberColumn<UserRow>('employeeAvgNetPerDay', 'Avg net / day', {
        heat: 'median',
        width: 140,
        tooltip: 'Daily profit per employee: their output value minus wages, with the managers\' wages shared out.',
      }),
      compactNumberColumn<UserRow>('employeeAvgHappiness', 'Avg happiness', {
        heat: 'median',
        width: 150,
        tooltip: 'Average employee happiness. Below 50 hurts production.',
      }),
      localeNumberColumn<UserRow>('employeeRetiringSoon', 'Retiring ≤7d', {
        heat: 'invertMedian',
        width: 135,
        tooltip: 'Employees retiring within a week.',
      }),
    ],
    premium: [
      localeNumberColumn<UserRow>('premiumMonths', 'Premium Mo.', { heat: 'ramp', width: 145 }),
      localeNumberColumn<UserRow>('premiumGifts', 'Premium Gifts', { heat: 'ramp', width: 155 }),
      localeNumberColumn<UserRow>('gemsPurchased', 'Gems Purchased', { heat: 'ramp', width: 175 }),
    ],
    cases: casesColumns<UserRow>(),
  },
)
