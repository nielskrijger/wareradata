'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'

import { EmptyDash } from '@/components/empty-dash'
import { Countdown } from '@/components/relative-time'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  status: 'buff' | 'debuff' | 'neither' | null
  // ISO timestamp when the active buff/debuff ends. When set, the pill shows a
  // live countdown ("3h12m") that ticks down on its own; without it the pill
  // falls back to a plain "Buff" / "Debuff" label.
  endsAt?: string | null
  // Wrap the buff/debuff pill in a hover tooltip (effect + exact end time).
  // Off inside the user hover-card, where it would nest a tooltip in a tooltip.
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
 * Once the countdown runs out the buff/debuff has worn off, so the pill should
 * read "Ready" instead of a stale "0m". The snapshot's status flag lags the
 * clock, so we detect expiry on the client. `now` stays null on the server and
 * the first client render (so both agree the effect is still active, no
 * hydration mismatch); a deferred update then reads the real clock and a 30s
 * interval keeps it live, matching the countdown's own cadence.
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
 * Readiness pill from a user's attack buffs/debuffs: green "Buff" (net attack
 * bonus) and red "Debuff" (net penalty), each counting down the time remaining,
 * or a neutral-grey "Ready" when neither is active (baseline, free to take a buff).
 * Buff/debuff carry a hover tooltip with the exact end time; renders the
 * empty-dash placeholder when unknown.
 */
export function ReadinessBadge({ status, endsAt, withTooltip = true }: Props) {
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
  const cls = isBuff
    ? 'bg-green-500/15 text-green-800 gap-0.5 dark:text-green-300'
    : 'bg-red-500/15 text-red-800 gap-0.5 dark:text-red-300'
  const Icon = isBuff ? ArrowUp : ArrowDown

  const badge = (
    <Badge className={cls}>
      <Icon className="size-3" />
      {endsAt
        ? <Countdown iso={endsAt} className="tabular-nums" />
        : (isBuff ? 'Buff' : 'Debuff')}
    </Badge>
  )

  if (!withTooltip) {
    return badge
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex w-fit cursor-default">{badge}</span>} />
      <TooltipContent>
        <div className="font-medium" style={{ color: isBuff ? 'var(--heat-green)' : 'var(--heat-red)' }}>
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
