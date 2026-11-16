import type { GroupVitals } from '@/lib/rows'

import { CombatModeBadge } from '@/components/badges/combat-mode-badge'
import { SidebarSection } from '@/components/detail/detail-sidebar'
import { LeanSplit } from '@/components/detail/lean-split'
import { ReadinessRows } from '@/components/detail/readiness-rows'
import { SectionHeading } from '@/components/detail/section-heading'
import { VitalRows } from '@/components/detail/vital-rows'
import { classifyWarShare } from '@/lib/skills/classify'

/**
 * The members' readiness, vitals and war/eco lean, as sidebar sections of an
 * MU, country or alliance.
 */
export function GroupCondition({ row }: { row: GroupVitals }) {
  const { buff, ready, debuff } = row.readinessPill

  return (
    <>
      {buff + ready + debuff > 0 && (
        <SidebarSection>
          <SectionHeading title="Readiness" />
          <ReadinessRows mix={row.readinessPill} />
        </SidebarSection>
      )}

      {(row.avgHealth != null || row.avgHunger != null) && (
        <SidebarSection>
          <SectionHeading
            title="Vitals"
            aside={<span className="text-muted-foreground text-xs">member average</span>}
          />
          <VitalRows health={row.avgHealth} hunger={row.avgHunger} />
        </SidebarSection>
      )}

      <SidebarSection>
        <SectionHeading title="War / eco lean" aside={<CombatModeBadge mode={classifyWarShare(row.avgWarShare)} />} />
        <LeanSplit avgWarShare={row.avgWarShare} />
      </SidebarSection>
    </>
  )
}
