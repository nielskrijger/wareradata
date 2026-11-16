import { PageMain } from '@/components/layout/page-main'

import { Panel } from '@/components/panel'
import { cn } from '@/lib/utils'
import { ADVISE_WIDTH } from './width'

const PULSE = 'bg-muted animate-pulse rounded-md'

/**
 * A skeleton in the page's own shapes, so nothing jumps when the advice arrives.
 */
export default function Loading() {
  return (
    <PageMain className={cn('flex flex-col gap-5', ADVISE_WIDTH)} aria-busy>
      <div className="flex flex-col gap-2">
        <h1 className="font-brand text-4xl leading-none tracking-wide">Advise</h1>
        <span className={cn(PULSE, 'h-4 w-72')} />
      </div>
      <Panel className="flex flex-col gap-3">
        <span className={cn(PULSE, 'h-5 w-64')} />
        <span className={cn(PULSE, 'h-8 w-full rounded-lg')} />
      </Panel>
      <Panel padding="none" className="overflow-hidden">
        {[60, 45, 55, 40, 50].map(w => (
          <div key={w} className="flex items-center gap-4 border-t px-4 py-4 first:border-t-0">
            <span className="flex flex-1 flex-col gap-2">
              <span className={`${PULSE} h-4`} style={{ width: `${w}%` }} />
              <span className={`${PULSE} h-3`} style={{ width: `${w + 20}%` }} />
            </span>
            <span className={cn(PULSE, 'h-4 w-16')} />
          </div>
        ))}
      </Panel>
    </PageMain>
  )
}
