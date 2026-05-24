import { ExternalLink } from '@/components/external-link'
import { InternalLink } from '@/components/internal-link'
import { wareraUrl } from '@/lib/warera/urls'

interface Props {
  muId: string | null
  muName: string | null
}

/**
 * MU cell shared by /users and /mus.
 *
 * The MU name is an internal link to /users prefiltered to that MU
 * (`?q=mu:"<name>"` — quoted because MU names contain spaces). A small
 * icon next to it opens the MU page on app.warera.io in a new tab.
 */
export function MUCell({ muId, muName }: Props) {
  if (!muName) {
    return '—'
  }
  return (
    <div className="flex items-center gap-2">
      <InternalLink href={`/users?q=${encodeURIComponent(`mu:"${muName}"`)}`} bold>
        {muName}
      </InternalLink>
      {muId && (
        <ExternalLink
          href={wareraUrl('mu', muId)}
          label={`Open ${muName} on warera.io`}
        />
      )}
    </div>
  )
}
