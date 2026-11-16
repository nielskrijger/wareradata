import type { EntityRef } from '@/lib/rows'

import { CountryCell } from '@/components/cells/country-cell'
import { GroupCell } from '@/components/cells/group-cell'
import { UserNameCell } from '@/components/cells/user-name-cell'
import { EmptyDash } from '@/components/empty-dash'

/**
 * The matching cell for a user, MU or country.
 */
export function EntityCell({ entity: e }: { entity: EntityRef }) {
  if (e.kind === 'mu') {
    return <GroupCell kind="mu" name={e.name} id={e.id} avatarUrl={e.avatarUrl} />
  }

  if (e.kind === 'country') {
    return <CountryCell countryCode={e.code} countryName={e.name} countryId={e.id} />
  }

  // Users outside the snapshot have no name to show.
  if (!e.name) {
    return <EmptyDash />
  }

  return (
    <UserNameCell
      userId={e.id}
      name={e.name}
      avatarUrl={e.avatarUrl}
      colorScheme={e.colorScheme}
      countryCode={e.code}
    />
  )
}
