import type { ReactNode } from 'react'
import type { GearLookup } from '@/lib/gear/score'
import type { UserRow } from '@/lib/rows'
import type { CasesByType, Equipment } from '@/lib/warera/api'

import { Avatar } from '@/components/avatar'
import { ReadinessBadge } from '@/components/badges/readiness-badge'
import { TierBadge } from '@/components/badges/tier-badge'
import { CountryCell } from '@/components/cells/country-cell'
import { GroupCell } from '@/components/cells/group-cell'
import { LevelTooltipContent } from '@/components/cells/level-tooltip-content'
import { PrestigeSkull } from '@/components/cells/prestige-skull'
import { DetailSidebar, Fact, SidebarIdentity, SidebarSection } from '@/components/detail/detail-sidebar'
import { emblemRing } from '@/components/detail/emblem-ring'
import { GearBand } from '@/components/detail/gear-band'
import { SectionHeading } from '@/components/detail/section-heading'
import { VitalRows } from '@/components/detail/vital-rows'
import { EmptyDash } from '@/components/empty-dash'
import { CasesSummary } from '@/components/profile/cases-summary'
import { SkillSplit } from '@/components/profile/skill-split'
import { RelativeTime } from '@/components/relative-time'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDate } from '@/lib/format'
import { schemeRgb } from '@/lib/warera/color-schemes'

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
          style={{ boxShadow: emblemRing(`rgb(${rgb})`) }}
        />
      )}
      refresh={refresh}
    >
      <SidebarIdentity
        name={user.username}
        kind="user"
        id={user.id}
        badges={(
          <>
            {user.levelTier && <TierBadge tier={user.levelTier} />}
            {user.readinessStatus != null && (
              <ReadinessBadge status={user.readinessStatus} endsAt={user.readinessEndsAt} />
            )}
            {user.isBanned && <Badge className="bg-red-500/15 text-red-900 dark:text-red-300">banned</Badge>}
          </>
        )}
      >
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
                <LevelTooltipContent {...user} rankedTotal={total} />
              </TooltipContent>
            </Tooltip>
          )}
        </Fact>
        <Fact label="MU">
          {user.muName
            ? <GroupCell kind="mu" name={user.muName} id={user.muId} avatarUrl={user.muAvatarUrl} />
            : <EmptyDash />}
        </Fact>
        <Fact label="Party">
          {user.partyName
            ? <GroupCell kind="party" name={user.partyName} id={user.partyId} avatarUrl={user.partyAvatarUrl} />
            : <EmptyDash />}
        </Fact>
        <Fact label="Joined">{user.createdAt ? formatDate(user.createdAt) : <EmptyDash />}</Fact>
        <Fact label="Last seen"><RelativeTime iso={user.lastConnectionAt} /></Fact>
      </SidebarIdentity>

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
