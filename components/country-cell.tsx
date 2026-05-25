import { EmptyDash } from '@/components/empty-dash'
import { Flag } from '@/components/flag'
import { InternalLink } from '@/components/internal-link'

interface Props {
  countryCode: string | null
  countryName: string | null
  countryId: string | null
}

/**
 * Country cell shared by /users, /countries, /mus, /parties, /regions, and the
 * detail headers. The flag + name link to the country detail page. For the
 * warera.io link, use the dedicated trailing "WarEra" column on each table.
 */
export function CountryCell({ countryCode, countryName, countryId }: Props) {
  if (!countryCode && !countryName) {
    return <EmptyDash />
  }
  const label = countryName ?? countryCode ?? ''
  return (
    <div className="flex min-w-0 items-center gap-2">
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
    </div>
  )
}
