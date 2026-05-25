import { EmptyDash } from '@/components/empty-dash'
import { InternalLink } from '@/components/internal-link'

interface Props {
  partyName: string | null
}

/**
 * Party cell shown on /users. The name links back to /users prefiltered to
 * everyone in that party (`?q=party:"<name>"` — quoted because party names
 * often contain spaces). Long names ellipsize with a native title tooltip.
 */
export function PartyCell({ partyName }: Props) {
  if (!partyName) {
    return <EmptyDash />
  }
  const href = `/users?q=${encodeURIComponent(`party:"${partyName}"`)}`
  return (
    <InternalLink href={href} title={partyName} className="block truncate">
      {partyName}
    </InternalLink>
  )
}
