import type { ReactNode } from 'react'
import type { MURow } from '@/lib/rows'

import { Drumstick, Heart } from 'lucide-react'

import { Avatar } from '@/components/avatar'
import { CombatModeBadge } from '@/components/badges/combat-mode-badge'
import { TierBadge } from '@/components/badges/tier-badge'
import { CountryCell } from '@/components/cells/country-cell'
import { UserNameCell } from '@/components/cells/user-name-cell'
import { LeanSplit } from '@/components/detail/combat-mode-card'
import { VitalRow } from '@/components/detail/vitals-card'
import { EmptyDash } from '@/components/empty-dash'
import { ExternalLink } from '@/components/links'
import { SectionHeading } from '@/components/profile/section-heading'
import { ReadinessRows } from '@/components/readiness-pill-card'
import { UserHoverCard } from '@/components/user-hover-card'
import { classifyWarShare } from '@/lib/skills/classify'
import { wareraUrl } from '@/lib/warera/urls'

interface Props {
  mu: MURow

  /**
   * The refresh control, pinned top-right next to the avatar.
   */
  refresh: ReactNode
}

/**
 * The MU page's left column: who the MU is, then its members' condition.
 * Everything ranked lives in the rank map instead.
 */
export function MUSidebar({ mu, refresh }: Props) {
  const { buff, ready, debuff } = mu.readinessPill

  return (
    <aside
      className="bg-card flex flex-col gap-4 self-start rounded-md border p-5"
      // MUs have no colour scheme, so a neutral wash stands in for the profile's.
      style={{ backgroundImage: 'linear-gradient(180deg, var(--muted), transparent 9rem)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <Avatar
          src={mu.avatarUrl}
          name={mu.name}
          size={88}
          style={{ boxShadow: '0 0 0 3px var(--card), 0 0 0 4px var(--border)' }}
        />
        {refresh}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-brand text-[32px] leading-none tracking-wide break-all">{mu.name}</h1>
          {mu.damageTier && <TierBadge tier={mu.damageTier} />}
        </div>

        <dl className="space-y-1 text-sm">
          <Fact label="Country">
            <CountryCell countryCode={mu.countryCode} countryName={mu.countryName} countryId={mu.countryId} />
          </Fact>
          <Fact label="Region">{mu.regionName ?? <EmptyDash />}</Fact>
          <Fact label="Leader">
            {mu.leaderName
              ? (
                  <UserHoverCard userId={mu.leaderId}>
                    <UserNameCell
                      userId={mu.leaderId}
                      name={mu.leaderName}
                      avatarUrl={mu.leaderAvatarUrl}
                      colorScheme={mu.leaderColorScheme}
                    />
                  </UserHoverCard>
                )
              : <EmptyDash />}
          </Fact>
          <Fact label="Members">{mu.memberCount.toLocaleString()}</Fact>
          <Fact label="Headquarters"><Level value={mu.headquartersLevel} /></Fact>
          <Fact label="Dormitories"><Level value={mu.dormitoriesLevel} /></Fact>
        </dl>

        <ExternalLink href={wareraUrl('mu', mu.id)}>WarEra.io</ExternalLink>
      </div>

      {buff + ready + debuff > 0 && (
        <Section>
          <SectionHeading title="Readiness" />
          <ReadinessRows mix={mu.readinessPill} />
        </Section>
      )}

      {(mu.avgHealth != null || mu.avgHunger != null) && (
        <Section>
          <SectionHeading
            title="Vitals"
            aside={<span className="text-muted-foreground text-xs">member average</span>}
          />
          <VitalRow label="Health" icon={<Heart className="size-4" />} value={mu.avgHealth} />
          <VitalRow label="Hunger" icon={<Drumstick className="size-4" />} value={mu.avgHunger} />
        </Section>
      )}

      <Section>
        <SectionHeading title="War / eco lean" aside={<CombatModeBadge mode={classifyWarShare(mu.avgWarShare)} />} />
        <LeanSplit avgWarShare={mu.avgWarShare} />
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

function Level({ value }: { value: number | null }) {
  return value == null ? <EmptyDash /> : `Level ${value}`
}
