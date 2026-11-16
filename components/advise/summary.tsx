import type { AdvisorSummary } from '@/lib/advisor/types'

import { Kpi } from '@/components/detail/kpi'
import { goldSigned, netClass } from '@/components/factories/format'
import { Panel } from '@/components/panel'
import { cn } from '@/lib/utils'

function PerDay({ value }: { value: number }) {
  return (
    <>
      <span className={cn(netClass(value))}>{goldSigned(value)}</span>
      <span className="text-muted-foreground text-sm"> / day</span>
    </>
  )
}

/**
 * Where the owner stands today and after every step below, at today's market.
 */
export function AdviseSummary({ summary: s }: { summary: AdvisorSummary }) {
  const staff = s.outputPerDay - s.engineOutputPerDay - s.payrollPerDay

  return (
    <Panel as="section" className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Kpi
        label="Profit now"
        value={<PerDay value={s.netPerDay} />}
        sub={`${goldSigned(s.outputPerDay)} output − ${goldSigned(s.payrollPerDay).replace('+', '')} payroll`}
      />
      <Kpi
        label="Staff after wages"
        value={<PerDay value={staff} />}
        sub={`engines add ${goldSigned(s.engineOutputPerDay)}`}
      />
      <Kpi
        label="With these steps"
        value={<PerDay value={s.netPerDay + s.stepsPerDay} />}
        sub={`${goldSigned(s.stepsPerDay)} a day`}
      />
      <Kpi
        label="Toolboxes"
        value={(
          <>
            {s.toolboxesPerDay.toFixed(2)}
            <span className="text-muted-foreground text-sm"> / day</span>
          </>
        )}
        sub="from your workers' luck"
      />
    </Panel>
  )
}
