import type { GovernmentOfficial, GovernmentRow } from '@/lib/rows'

import Link from 'next/link'

import { Avatar } from '@/components/avatar'
import { InternalLink } from '@/components/links'
import { UserHoverCard } from '@/components/user-hover-card'
import { cn } from '@/lib/utils'

interface Props {
  // Resolved government for the country, or null when none was captured (a
  // dormant or unoccupied country). The section renders nothing in that case.
  government: GovernmentRow | null
}

// Parties have no colour in the WarEra API, so we assign one per party
// deterministically: the largest bloc gets the first (most separable) hue, on
// down. Medium-saturation values chosen to read on both light and dark cards.
const PARTY_PALETTE = [
  '37, 99, 235', // blue
  '220, 38, 38', // red
  '5, 150, 105', // emerald
  '217, 119, 6', // amber
  '147, 70, 210', // purple
  '13, 160, 160', // teal
  '222, 49, 130', // pink
  '120, 170, 40', // lime
  '90, 110, 145', // steel
  '233, 100, 30', // orange
]

// Neutral grey for officials with no party (independents).
const INDEPENDENT_RGB = '130, 130, 140'

// Sentinel bench id for the no-party group, which has no party page to link to.
const INDEPENDENT_KEY = '__independent'

const ROLE_SHORT: Record<string, string> = {
  'President': 'President',
  'Vice President': 'Vice President',
  'Min. of Defense': 'Defense',
  'Min. of Economy': 'Economy',
  'Min. of Foreign Affairs': 'Foreign',
}

interface Bench {
  id: string
  name: string
  avatarUrl: string | null
  color: string
  members: GovernmentOfficial[]
}

/**
 * Assigns each party an RGB triplet, ordered by how many officials belong to it
 * (largest first), so the biggest blocs get the most distinct colours and the
 * mapping is stable for a given government.
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
  ordered.forEach(([id], i) => colors.set(id, PARTY_PALETTE[i % PARTY_PALETTE.length]))
  return colors
}

function colorFor(partyId: string | null, colors: Map<string, string>): string {
  if (!partyId) {
    return INDEPENDENT_RGB
  }
  return colors.get(partyId) ?? INDEPENDENT_RGB
}

// First occurrence wins, so a member can't take two seats (and two React keys).
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
 * The country detail page's elected-officials block, drawn like a legislature
 * floor: the executive as a labelled front bench, then congress split into
 * party benches (party emblem + seat count, members as party-coloured faces).
 *
 * Faces are quiet by design: hover one for the shared user card (avatar, vitals,
 * stats) or click to open the player's page. Names only show inline for the
 * executive, where they matter most. Renders nothing when the country has no
 * government, or every seat is vacant. Responsive: benches stack their header
 * above the faces on phones and sit side by side from `sm` up.
 */
export function GovernmentSection({ government }: Props) {
  if (!government) {
    return null
  }

  const seats = [
    { label: 'President', official: government.president },
    { label: 'Vice President', official: government.vicePresident },
    { label: 'Min. of Defense', official: government.minOfDefense },
    { label: 'Min. of Economy', official: government.minOfEconomy },
    { label: 'Min. of Foreign Affairs', official: government.minOfForeignAffairs },
  ].filter((s): s is { label: string, official: GovernmentOfficial } => s.official !== null)

  const congress = dedupeById(government.congressMembers)
  if (seats.length === 0 && congress.length === 0) {
    return null
  }

  const colors = assignPartyColors([...seats.map(s => s.official), ...congress])
  const benches = congressBenches(congress, colors)

  return (
    <section className="space-y-3">
      <h2 className="font-brand text-lg tracking-wide">Government</h2>
      <div className="bg-card space-y-4 rounded-md border p-4">
        {seats.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-6">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wide sm:w-20 sm:shrink-0 sm:pt-1">Executive</span>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 sm:justify-start">
              {seats.map(seat => (
                <div key={seat.label} className="flex w-20 flex-col items-center gap-1 text-center">
                  <GovFace official={seat.official} size={48} color={colorFor(seat.official.partyId, colors)} />
                  <span className="text-muted-foreground text-[10px] uppercase">{ROLE_SHORT[seat.label] ?? seat.label}</span>
                  <InternalLink href={`/users/${seat.official.id}`} bold title={seat.official.name} className="block w-full truncate text-xs">
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
                style={{ backgroundColor: `rgba(${bench.color}, 0.08)`, borderLeft: `3px solid rgb(${bench.color})` }}
              >
                <div className="flex items-center gap-2 sm:w-48 sm:shrink-0">
                  {bench.avatarUrl
                    ? <Avatar src={bench.avatarUrl} name={bench.name} size={20} />
                    : <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: `rgb(${bench.color})` }} />}
                  {bench.id === INDEPENDENT_KEY
                    ? <span className="truncate text-xs font-medium" title={bench.name}>{bench.name}</span>
                    : (
                        <InternalLink href={`/parties/${bench.id}`} bold title={bench.name} className="min-w-0 truncate text-xs">
                          {bench.name}
                        </InternalLink>
                      )}
                  <span className="text-muted-foreground ml-auto shrink-0 text-xs tabular-nums">{bench.members.length}</span>
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
      </div>
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
          style={{ boxShadow: `0 0 0 2px rgb(${color})` }}
        />
      </Link>
    </UserHoverCard>
  )
}
