import type { ReactNode } from 'react'
import type { GearLookup } from '@/lib/gear/score'
import type { UserRow } from '@/lib/rows'
import type { CasesByType, Equipment } from '@/lib/warera/api'

import { Avatar } from '@/components/avatar'
import { ReadinessBadge } from '@/components/badges/readiness-badge'
import { TierBadge } from '@/components/badges/tier-badge'
import { RED_BADGE } from '@/components/badges/tone'
import { CountryCell } from '@/components/cells/country-cell'
import { MUCell } from '@/components/cells/mu-cell'
import { PartyCell } from '@/components/cells/party-cell'
import { PrestigeSkull } from '@/components/cells/prestige-skull'
import { DetailSidebar, Fact, SidebarSection, SidebarTitle } from '@/components/detail/detail-sidebar'
import { GearBand } from '@/components/detail/gear-band'
import { SectionHeading } from '@/components/detail/section-heading'
import { VitalRows } from '@/components/detail/vitals-card'
import { EmptyDash } from '@/components/empty-dash'
import { ExternalLink } from '@/components/links'
import { CasesSummary } from '@/components/profile/cases-summary'
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
    <DetailSidebar
      // The player's own colour scheme, faded out behind the avatar.
      wash={`rgba(${rgb}, 0.22)`}
      avatar={(
        <Avatar
          src={user.avatarUrl}
          name={user.username}
          size={88}
          style={{ boxShadow: `0 0 0 3px var(--card), 0 0 0 4px rgb(${rgb})` }}
        />
      )}
      refresh={refresh}
    >
      <div className="space-y-3">
        <SidebarTitle name={user.username}>
          {user.levelTier && <TierBadge tier={user.levelTier} />}
          {user.readinessStatus != null && (
            <ReadinessBadge status={user.readinessStatus} endsAt={user.readinessEndsAt} />
          )}
          {user.isBanned && <Badge className={RED_BADGE}>banned</Badge>}
        </SidebarTitle>

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
        <SidebarSection>
          <SectionHeading title="Gear" />
          <GearBand score={user.gearScore} equipment={equipment} gearLookup={gearLookup} />
        </SidebarSection>
      )}

      {(user.health != null || user.hunger != null) && (
        <SidebarSection>
          <SectionHeading title="Vitals" />
          <VitalRows health={user.health} hunger={user.hunger} />
        </SidebarSection>
      )}

      <SidebarSection>
        <SkillSplit mode={user.combatMode} warPoints={user.warPoints} ecoPoints={user.ecoPoints} />
      </SidebarSection>

      <SidebarSection>
        <CasesSummary combinedOpened={user.casesOpened} rank={user.casesOpenedRank} rankOf={total} {...cases} />
      </SidebarSection>
    </DetailSidebar>
  )
}
