'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'

import { GREEN_BADGE, RED_BADGE } from '@/components/badges/tone'
import { EmptyDash } from '@/components/empty-dash'
import { Countdown } from '@/components/relative-time'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface Props {
  status: 'buff' | 'debuff' | 'neither' | null

  /**
   * ISO timestamp when the active buff/debuff ends. When set, the pill shows a
   * live countdown ("3h12m") that ticks down on its own; without it the pill
   * falls back to a plain "Buff" / "Debuff" label.
   */
  endsAt?: string | null

  /**
   * Wrap the buff/debuff pill in a hover tooltip (effect + exact end time).
   * Off inside the user hover-card, where it would nest a tooltip in a tooltip.
   */
  withTooltip?: boolean
}

/**
 * Absolute wall-clock time the effect ends ("Mon, 21:34"), in the viewer's
 * locale and timezone. The badge shows the relative countdown; the tooltip adds
 * the exact moment it wears off (and the day, for debuffs that cross midnight).
 */
function formatEndsAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Whether the effect has worn off, since the snapshot's status lags the clock.
 *
 * `now` stays null on the server and the first client render so hydration
 * matches; a 30s interval then keeps it live, like the countdown.
 */
function useExpired(iso: string | null | undefined): boolean {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const update = () => setNow(Date.now())
    const initial = setTimeout(update, 0)
    const id = setInterval(update, 30_000)

    return () => {
      clearTimeout(initial)
      clearInterval(id)
    }
  }, [])

  return now != null && iso != null && Date.parse(iso) <= now
}

/**
 * Buff (green) or Debuff (red) with a countdown, or a grey Ready when neither
 * is active.
 */
export function BuffBadge({ status, endsAt, withTooltip = true }: Props) {
  const expired = useExpired(endsAt)

  if (status == null) {
    return <EmptyDash />
  }

  // "neither" is the baseline; an expired buff/debuff collapses to the same
  // "Ready" pill once its countdown has elapsed, dropping the (now past) tooltip.
  if (status === 'neither' || expired) {
    return (
      <Badge className="bg-neutral-500/15 text-neutral-800 dark:text-neutral-300">
        Ready
      </Badge>
    )
  }

  const isBuff = status === 'buff'
  const cls = isBuff ? GREEN_BADGE : RED_BADGE

  const Icon = isBuff ? ArrowUp : ArrowDown

  const badge = (
    <Badge className={cn(cls, 'gap-0.5')}>
      <Icon className="size-3" />
      {endsAt ? <Countdown iso={endsAt} className="tabular-nums" /> : (isBuff ? 'Buff' : 'Debuff')}
    </Badge>
  )

  if (!withTooltip) {
    return badge
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex w-fit cursor-default">{badge}</span>} />
      <TooltipContent>
        <div className="font-medium" style={{ color: isBuff ? 'var(--heat-green-text)' : 'var(--heat-red)' }}>
          {isBuff ? 'Attack buff' : 'Attack debuff'}
        </div>
        {endsAt && (
          <div className="text-neutral-50/70" suppressHydrationWarning>
            {`Ends ${formatEndsAt(endsAt)}`}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
