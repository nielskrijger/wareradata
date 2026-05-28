'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { UserRow } from '@/lib/rows'

import { CompactNumber } from '@/components/compact-number'
import { CountryCell } from '@/components/country-cell'
import { InfoTooltip } from '@/components/info-tooltip'
import { ExternalLink } from '@/components/links'
import { MUCell } from '@/components/mu-cell'
import { PartyCell } from '@/components/party-cell'
import { PercentBar } from '@/components/percent-bar'
import { PointsBreakdownCell } from '@/components/points-breakdown-cell'
import { ReadinessBadge } from '@/components/readiness-badge'
import { RelativeTime } from '@/components/relative-time'
import { TierBadge } from '@/components/tier-badge'
import { Badge } from '@/components/ui/badge'
import { UserHoverCard } from '@/components/user-hover-card'
import { UserNameCell } from '@/components/user-name-cell'
import { wareraUrl } from '@/lib/warera/urls'

export type { UserRow }

export const userColumns: ColumnDef<UserRow>[] = [
  {
    accessorKey: 'username',
    header: 'User',
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-2">
        <UserHoverCard userId={row.original.id}>
          <UserNameCell userId={row.original.id} name={row.original.username} avatarUrl={row.original.avatarUrl} colorScheme={row.original.colorScheme} />
        </UserHoverCard>
        {row.original.isBanned && <Badge className="shrink-0 bg-red-500/15 text-red-900 dark:text-red-300">banned</Badge>}
      </div>
    ),
    meta: { width: 220 },
  },
  {
    accessorKey: 'points',
    header: 'Points',
    cell: ({ row }) => (
      <PointsBreakdownCell
        total={row.original.points}
        level={row.original.levelPoints}
        damage={row.original.damagePoints}
        wealth={row.original.wealthPoints}
      />
    ),
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 90 },
  },
  {
    accessorKey: 'countryCode',
    header: 'Country',
    cell: ({ row }) => (
      <CountryCell
        countryCode={row.original.countryCode}
        countryName={row.original.countryName}
        countryId={row.original.countryId}
      />
    ),
    meta: { width: 180 },
  },
  {
    accessorKey: 'healthPercent',
    header: 'Health',
    cell: ({ row }) => <PercentBar value={row.original.healthPercent} />,
    sortDescFirst: true,
    sortUndefined: 'last',
    meta: { width: 120 },
  },
  {
    accessorKey: 'hungerPercent',
    header: 'Hunger',
    cell: ({ row }) => <PercentBar value={row.original.hungerPercent} />,
    sortDescFirst: true,
    sortUndefined: 'last',
    meta: { width: 120 },
  },
  {
    accessorKey: 'readinessStatus',
    header: 'Status',
    cell: ({ row }) => <ReadinessBadge status={row.original.readinessStatus} />,
    meta: { width: 100 },
  },
  {
    accessorKey: 'levelRank',
    header: 'Level Rank',
    cell: ({ row }) => row.original.levelRank ?? null,
    sortUndefined: 'last',
    meta: { heat: 'invert', align: 'right', width: 110 },
  },
  {
    accessorKey: 'level',
    header: 'Level',
    cell: ({ row }) => row.original.level ?? null,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 70 },
  },
  {
    accessorKey: 'levelTier',
    header: 'Tier',
    cell: ({ row }) => <TierBadge tier={row.original.levelTier} />,
    meta: { width: 90 },
  },
  {
    accessorKey: 'damageRank',
    header: 'Damage Rank',
    cell: ({ row }) => row.original.damageRank ?? null,
    meta: { heat: 'invert', align: 'right', width: 130 },
  },
  {
    accessorKey: 'damage',
    header: 'Total Damage',
    cell: ({ row }) => <CompactNumber value={row.original.damage} />,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 130 },
  },
  {
    accessorKey: 'weeklyDamage',
    header: 'Weekly Damage',
    cell: ({ row }) => <CompactNumber value={row.original.weeklyDamage} />,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 140 },
  },
  {
    accessorKey: 'wealthRank',
    header: 'Wealth Rank',
    cell: ({ row }) => row.original.wealthRank ?? null,
    meta: { heat: 'invert', align: 'right', width: 120 },
  },
  {
    accessorKey: 'wealth',
    header: 'Wealth',
    cell: ({ row }) => <CompactNumber value={row.original.wealth} />,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 90 },
  },
  {
    accessorKey: 'militaryRank',
    header: 'Mil. Rank',
    cell: ({ row }) => row.original.militaryRank ?? null,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 100 },
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
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ row }) => row.original.createdAt?.slice(0, 10) ?? null,
    sortDescFirst: true,
    meta: { width: 110 },
  },
  {
    accessorKey: 'bounty',
    header: 'Bounty',
    cell: ({ row }) => <CompactNumber value={row.original.bounty} />,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 90 },
  },
  {
    accessorKey: 'terrain',
    header: 'Terrain',
    cell: ({ row }) => row.original.terrain?.toLocaleString() ?? null,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 90 },
  },
  {
    accessorKey: 'referrals',
    header: 'Referrals',
    cell: ({ row }) => row.original.referrals?.toLocaleString() ?? null,
    sortDescFirst: true,
    meta: { heat: 'ramp', align: 'right', width: 100 },
  },
  {
    accessorKey: 'premiumMonths',
    header: 'Premium Mo.',
    cell: ({ row }) => row.original.premiumMonths?.toLocaleString() ?? null,
    sortDescFirst: true,
    meta: { heat: 'ramp', align: 'right', width: 120 },
  },
  {
    accessorKey: 'premiumGifts',
    header: 'Premium Gifts',
    cell: ({ row }) => row.original.premiumGifts?.toLocaleString() ?? null,
    sortDescFirst: true,
    meta: { heat: 'ramp', align: 'right', width: 130 },
  },
  {
    accessorKey: 'casesOpened',
    header: 'Cases Opened',
    cell: ({ row }) => row.original.casesOpened?.toLocaleString() ?? null,
    sortDescFirst: true,
    meta: { heat: 'median', heatLog: true, align: 'right', width: 130 },
  },
  {
    accessorKey: 'gemsPurchased',
    header: 'Gems Purchased',
    cell: ({ row }) => row.original.gemsPurchased?.toLocaleString() ?? null,
    sortDescFirst: true,
    meta: { heat: 'ramp', align: 'right', width: 150 },
  },
  {
    accessorKey: 'pointsPerDay',
    header: 'Points / day',
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
            className="text-muted-foreground no-underline"
          />
        )
      }
      return null
    },
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 110 },
  },
  {
    id: 'warera',
    header: 'Link',
    enableSorting: false,
    cell: ({ row }) => (
      <ExternalLink href={wareraUrl('user', row.original.id)}>
        WarEra.io
      </ExternalLink>
    ),
    meta: { width: 110 },
  },
]
