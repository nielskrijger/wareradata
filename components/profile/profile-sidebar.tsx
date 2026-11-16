import type { ReactNode } from 'react'
import type { GearLookup } from '@/lib/gear/score'
import type { UserRow } from '@/lib/rows'
import type { CasesByType, Equipment } from '@/lib/warera/api'

import { Drumstick, Heart } from 'lucide-react'

import { Avatar } from '@/components/avatar'
import { ReadinessBadge } from '@/components/badges/readiness-badge'
import { TierBadge } from '@/components/badges/tier-badge'
import { CountryCell } from '@/components/cells/country-cell'
import { MUCell } from '@/components/cells/mu-cell'
import { PartyCell } from '@/components/cells/party-cell'
import { PrestigeSkull } from '@/components/cells/prestige-skull'
import { GearBand } from '@/components/detail/gear-band'
import { VitalRow } from '@/components/detail/vitals-card'
import { EmptyDash } from '@/components/empty-dash'
import { ExternalLink } from '@/components/links'
import { CasesSummary } from '@/components/profile/cases-summary'
import { SectionHeading } from '@/components/profile/section-heading'
import { SkillSplit } from '@/components/profile/skill-split'
import { RelativeTime } from '@/components/relative-time'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { levelTooltipLines } from '@/lib/level-tooltip'
import { schemeRgb } from '@/lib/warera/color-schemes'
import { wareraUrl } from '@/lib/warera/urls'

interface Props {
  user: UserRow

  /**
   * Size of the ranked set, for the level and cases "of N".
   */
  total: number
  cases: CasesByType

  /**
   * The full loadout, or undefined when the gear was never captured.
   */
  equipment: Equipment | undefined
  gearLookup: GearLookup

  /**
   * The refresh control, pinned top-right next to the avatar.
   */
  refresh: ReactNode
}

/**
 * The profile's left column: who the player is, then their gear, vitals,
 * skills and cases. Everything ranked lives in the rank map instead.
 */
export function ProfileSidebar({ user, total, cases, equipment, gearLookup, refresh }: Props) {
  const rgb = schemeRgb(user.colorScheme)

  return (
    <aside
      className="bg-card flex flex-col gap-4 self-start rounded-md border p-5"
      // The player's own colour scheme, faded out behind the avatar.
      style={{ backgroundImage: `linear-gradient(180deg, rgba(${rgb}, 0.22), transparent 9rem)` }}
    >
      <div className="flex items-start justify-between gap-2">
        <Avatar
          src={user.avatarUrl}
          name={user.username}
          size={88}
          style={{ boxShadow: `0 0 0 3px var(--card), 0 0 0 4px rgb(${rgb})` }}
        />
        {refresh}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-brand text-[32px] leading-none tracking-wide break-all">{user.username}</h1>
          {user.levelTier && <TierBadge tier={user.levelTier} />}
          {user.readinessStatus != null && (
            <ReadinessBadge status={user.readinessStatus} endsAt={user.readinessEndsAt} />
          )}
          {user.isBanned && <Badge className="bg-red-500/15 text-red-900 dark:text-red-300">banned</Badge>}
        </div>

        <dl className="space-y-1 text-sm">
          <Fact label="Country">
            <CountryCell countryCode={user.countryCode} countryName={user.countryName} countryId={user.countryId} />
          </Fact>
          <Fact label="Level">
            {user.level == null ? <EmptyDash /> : (
              <Tooltip>
                <TooltipTrigger render={<span className="inline-flex cursor-default items-center gap-1 font-medium" />}>
                  <PrestigeSkull prestige={user.prestige} />
                  {user.level}
                </TooltipTrigger>
                <TooltipContent side="top">
                  {levelTooltipLines(user, total).map(line => <div key={line}>{line}</div>)}
                </TooltipContent>
              </Tooltip>
            )}
          </Fact>
          <Fact label="MU">
            {user.muName
              ? <MUCell muName={user.muName} muId={user.muId} avatarUrl={user.muAvatarUrl} />
              : <EmptyDash />}
          </Fact>
          <Fact label="Party">
            {user.partyName
              ? <PartyCell partyName={user.partyName} partyId={user.partyId} avatarUrl={user.partyAvatarUrl} />
              : <EmptyDash />}
          </Fact>
          <Fact label="Joined">{user.createdAt?.slice(0, 10) ?? <EmptyDash />}</Fact>
          <Fact label="Last seen"><RelativeTime iso={user.lastConnectionAt} /></Fact>
        </dl>

        <ExternalLink href={wareraUrl('user', user.id)}>WarEra.io</ExternalLink>
      </div>

      {/* A score of 0 still shows the gear so empty slots read as "nothing
          equipped"; null means the gear was never captured. */}
      {user.gearScore != null && (
        <Section>
          <SectionHeading title="Gear" />
          <GearBand score={user.gearScore} equipment={equipment} gearLookup={gearLookup} />
        </Section>
      )}

      {(user.health != null || user.hunger != null) && (
        <Section>
          <SectionHeading title="Vitals" />
          <VitalRow label="Health" icon={<Heart className="size-4" />} value={user.health} />
          <VitalRow label="Hunger" icon={<Drumstick className="size-4" />} value={user.hunger} />
        </Section>
      )}

      <Section>
        <SkillSplit
          mode={user.combatMode}
          warPoints={user.warPoints}
          ecoPoints={user.ecoPoints}
          warPointsRank={user.warPointsRank}
          ecoPointsRank={user.ecoPointsRank}
        />
      </Section>

      <Section>
        <CasesSummary combinedOpened={user.casesOpened} rank={user.casesOpenedRank} rankOf={total} {...cases} />
      </Section>
    </aside>
  )
}

function Section({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2 border-t pt-4">{children}</div>
}

function Fact({ label, children }: { label: string, children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="min-w-0 truncate text-right">{children}</dd>
    </div>
  )
}
