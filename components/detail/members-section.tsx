import type { ComponentProps } from 'react'

import type { EntityTableProps } from '@/components/data-table/data-table'
import type { GroupMembers, UserRow } from '@/lib/rows'

import { UsersTable } from '@/app/users/users-table'
import { RankMap } from '@/components/detail/rank-map/rank-map'
import { firstPage } from '@/lib/query'

type TableProps = Omit<EntityTableProps<UserRow>, 'initial' | 'overview'>

type Props = TableProps & Omit<ComponentProps<typeof RankMap>, 'members'> & {
  members: GroupMembers

  /**
   * One member, singular ("member", "citizen").
   */
  noun: string
}

/**
 * A group page's members table, with the group's rank map as its Overview.
 */
export function MembersSection({ members, noun, name, total, unit, groups, peers, ...table }: Props) {
  return (
    <UsersTable
      initial={firstPage(members.rows, 'points')}
      overview={(
        <RankMap
          name={name}
          total={total}
          unit={unit}
          groups={groups}
          peers={peers}
          members={{ ...members, noun }}
        />
      )}
      {...table}
    />
  )
}
