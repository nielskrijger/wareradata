import { EmptyDash } from '@/components/empty-dash'
import { Flag } from '@/components/flag'
import { InternalLink } from '@/components/internal-link'

interface Props {
  countryCode: string | null
  countryName: string | null
}

/**
 * Country cell shared by /users, /countries, and /mus.
 *
 * The country name is an internal link to /users prefiltered to that
 * country (`?q=country:<code>`). For the warera.io link, use the
 * dedicated trailing "WarEra" column on each table.
 */
export function CountryCell({ countryCode, countryName }: Props) {
  if (!countryCode && !countryName) {
    return <EmptyDash />
  }
  const label = countryName ?? countryCode ?? ''
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Flag code={countryCode} />
      <InternalLink
        href={`/users?q=${encodeURIComponent(`country:${countryCode}`)}`}
        title={label}
        className="truncate"
      >
        {label}
      </InternalLink>
    </div>
  )
}
