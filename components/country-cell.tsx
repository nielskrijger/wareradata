import { ExternalLink } from '@/components/external-link'
import { Flag } from '@/components/flag'
import { InternalLink } from '@/components/internal-link'
import { wareraUrl } from '@/lib/warera/urls'

interface Props {
  countryId: string | null
  countryCode: string | null
  countryName: string | null
}

/**
 * Country cell shared by /users, /countries, and /mus.
 *
 * The country name is an internal link to /users prefiltered to that
 * country (`?q=country:<code>`). A small icon next to it opens the
 * country page on app.warera.io in a new tab.
 */
export function CountryCell({ countryId, countryCode, countryName }: Props) {
  if (!countryCode && !countryName) {
    return '—'
  }
  const label = countryName ?? countryCode ?? ''
  return (
    <div className="flex items-center gap-2">
      <Flag code={countryCode} />
      <InternalLink href={`/users?q=${encodeURIComponent(`country:${countryCode}`)}`}>
        {label}
      </InternalLink>
      {countryId && (
        <ExternalLink
          href={wareraUrl('country', countryId)}
          label={`Open ${label} on warera.io`}
        />
      )}
    </div>
  )
}
