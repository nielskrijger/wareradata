import { InternalLink } from '@/components/links'

/**
 * A region name linking to /regions filtered to it; plain text without an id.
 */
export function RegionLink({ id, name, className }: { id: string | null, name: string, className?: string }) {
  return id
    ? <InternalLink href={`/regions?q=${encodeURIComponent(name)}`} className={className}>{name}</InternalLink>
    : <span className={className}>{name}</span>
}
