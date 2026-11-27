import type { GovernmentOfficial, GovernmentRow } from '@/lib/rows'

import Link from 'next/link'

import { Avatar } from '@/components/avatar'
import { COLOR, seriesColor, tint } from '@/components/colors'
import { InternalLink } from '@/components/links'
import { Panel } from '@/components/panel'
import { UserHoverCard } from '@/components/user-hover-card'
import { cn } from '@/lib/utils'

interface Props {
  /**
   * Resolved government for the country, or null when none was captured (a
   * dormant or unoccupied country). The section renders nothing in that case.
   */
  government: GovernmentRow | null
}

/**
 * Officials with no party (independents).
 */
const INDEPENDENT_COLOR = COLOR.grey

/**
 * Sentinel bench id for the no-party group, which has no party page to link to.
 */
const INDEPENDENT_KEY = '__independent'

interface Bench {
  id: string
  name: string
  avatarUrl: string | null
  color: string
  members: GovernmentOfficial[]
}

/**
 * Parties have no colour in the API, so each gets a series hue by size (largest
 * first): the biggest blocs get the most distinct colours, stable per government.
 */
function assignPartyColors(officials: GovernmentOfficial[]): Map<string, string> {
  const counts = new Map<string, number>()
  for (const o of officials) {
    if (o.partyId) {
      counts.set(o.partyId, (counts.get(o.partyId) ?? 0) + 1)
    }
  }

  const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const colors = new Map<string, string>()
  ordered.forEach(([id], i) => colors.set(id, seriesColor(i)))

  return colors
}

function colorFor(partyId: string | null, colors: Map<string, string>): string {
  if (!partyId) {
    return INDEPENDENT_COLOR
  }

  return colors.get(partyId) ?? INDEPENDENT_COLOR
}

/**
 * First occurrence wins, so a member can't take two seats (and two React keys).
 */
function dedupeById(officials: GovernmentOfficial[]): GovernmentOfficial[] {
  const seen = new Set<string>()
  const out: GovernmentOfficial[] = []
  for (const o of officials) {
    if (!seen.has(o.id)) {
      seen.add(o.id)
      out.push(o)
    }
  }

  return out
}

/**
 * Groups congress members into per-party "benches", biggest bloc first and
 * independents always last, each carrying its assigned colour and party emblem.
 */
function congressBenches(congress: GovernmentOfficial[], colors: Map<string, string>): Bench[] {
  const byParty = new Map<string, Bench>()
  for (const o of congress) {
    const key = o.partyId ?? INDEPENDENT_KEY
    let bench = byParty.get(key)
    if (!bench) {
      bench = {
        id: key,
        name: o.partyName ?? 'Independent',
        avatarUrl: o.partyAvatarUrl,
        color: colorFor(o.partyId, colors),
        members: [],
      }

      byParty.set(key, bench)
    }

    bench.members.push(o)
  }

  return [...byParty.values()].sort((a, b) => {
    if (a.id === INDEPENDENT_KEY) {
      return 1
    }

    if (b.id === INDEPENDENT_KEY) {
      return -1
    }

    return b.members.length - a.members.length
  })
}

/**
 * The elected officials drawn like a legislature floor: the executive as a
 * labelled front bench, then congress as party benches of faces.
 *
 * Only the executive shows names; the faces stay quiet and reveal the user
 * card on hover. Renders nothing when every seat is vacant.
 */
export function GovernmentSection({ government }: Props) {
  if (!government) {
    return null
  }

  // The executive bench: president and VP, then every appointed minister
  // under their title. Titles can repeat (two Defense ministers), so seats are
  // keyed by user and title.
  const seats = [
    { key: 'president', label: 'President', official: government.president },
    { key: 'vice-president', label: 'Vice President', official: government.vicePresident },
    ...government.ministers.map(m => ({
      key: `minister-${m.official.id}-${m.title}`,
      label: m.title,
      official: m.official,
    })),
  ].filter((s): s is { key: string, label: string, official: GovernmentOfficial } => s.official !== null)

  const congress = dedupeById(government.congressMembers)
  if (seats.length === 0 && congress.length === 0) {
    return null
  }

  const colors = assignPartyColors([...seats.map(s => s.official), ...congress])
  const benches = congressBenches(congress, colors)

  return (
    <section className="min-w-0 space-y-3">
      <h2 className="font-brand text-lg tracking-wide">Government</h2>
      <Panel className="space-y-4">
        {seats.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-6">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wide sm:w-20 sm:shrink-0 sm:pt-1">
              Executive
            </span>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 sm:justify-start">
              {seats.map(seat => (
                <div key={seat.key} className="flex w-20 flex-col items-center gap-1 text-center">
                  <GovFace official={seat.official} size={48} color={colorFor(seat.official.partyId, colors)} />
                  <span
                    className="text-muted-foreground block w-full truncate text-[10px] uppercase"
                    title={seat.label}
                  >
                    {seat.label}
                  </span>
                  <InternalLink
                    href={`/users/${seat.official.id}`}
                    bold
                    title={seat.official.name}
                    className="block w-full truncate text-xs"
                  >
                    {seat.official.name}
                  </InternalLink>
                </div>
              ))}
            </div>
          </div>
        )}

        {congress.length > 0 && (
          <div className={cn('space-y-2', seats.length > 0 && 'border-border/60 border-t pt-4')}>
            {benches.map(bench => (
              <div
                key={bench.id}
                className="flex flex-col gap-2 overflow-hidden rounded-md p-3 sm:flex-row sm:items-center sm:gap-3 sm:py-2"
                style={{ backgroundColor: tint(bench.color, 8), borderLeft: `3px solid ${bench.color}` }}
              >
                <div className="flex items-center gap-2 sm:w-48 sm:shrink-0">
                  {bench.avatarUrl ? <Avatar src={bench.avatarUrl} name={bench.name} size={20} /> : (
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: bench.color }}
                    />
                  )}
                  {bench.id === INDEPENDENT_KEY
                    ? <span className="truncate text-xs font-medium" title={bench.name}>{bench.name}</span>
                    : (
                        <InternalLink
                          href={`/parties/${bench.id}`}
                          bold
                          title={bench.name}
                          className="min-w-0 truncate text-xs"
                        >
                          {bench.name}
                        </InternalLink>
                      )}
                  <span className="text-muted-foreground ml-auto shrink-0 text-xs tabular-nums">
                    {bench.members.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {bench.members.map(member => (
                    <GovFace key={member.id} official={member} size={30} color={bench.color} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </section>
  )
}

/**
 * One official's face: a party-ringed avatar that opens the shared user hover
 * card on hover and links to the player's page on click. The avatar is the
 * trigger, so hovering the face (not just a name) reveals the details.
 */
function GovFace({ official, size, color }: { official: GovernmentOfficial, size: number, color: string }) {
  return (
    <UserHoverCard userId={official.id}>
      <Link href={`/users/${official.id}`} aria-label={official.name} className="inline-block rounded-full">
        <Avatar
          src={official.avatarUrl}
          name={official.name}
          size={size}
          style={{ boxShadow: `0 0 0 2px ${color}` }}
        />
      </Link>
    </UserHoverCard>
  )
}
