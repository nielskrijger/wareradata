import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface FactRowProps {
  /**
   * Render the row in muted text, for secondary facts (a user's MU/party, an
   * MU's leader) under the primary line.
   */
  muted?: boolean
  children: ReactNode
}

/**
 * A horizontal, wrapping line of facts under a detail header's title (country,
 * level, links, etc.). Items wrap on narrow screens.
 */
export function FactRow({ muted, children }: FactRowProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1 text-sm',
        muted && 'text-muted-foreground',
      )}
    >
      {children}
    </div>
  )
}

interface Props {
  /**
   * The overlapping emblem (a user/MU Avatar or a country Flag), already sized
   * and styled by the caller. Pulled up over the banner with a negative margin.
   */
  emblem: ReactNode
  title: string
  /**
   * Banner background. Defaults to the neutral muted gradient (MUs, countries);
   * the user page passes its color-scheme gradient via `style`.
   */
  bannerStyle?: CSSProperties
  /**
   * Fact rows under the title (country, level, links, etc.). Each is laid out
   * by the caller; the header just stacks them.
   */
  children: ReactNode
  /**
   * Optional control pinned to the bottom-right of the header, detached from the
   * fact rows (e.g. an MU's "last refreshed / refresh" action).
   */
  aside?: ReactNode
}

/**
 * Shared header for the user/MU/country detail pages: a thin banner strip with
 * an emblem overlapping it, the brand-styled name, and caller-supplied fact
 * rows. The emblem and banner differ per entity (avatar+scheme vs flag+neutral)
 * so both are passed in.
 */
export function DetailHeader({ emblem, title, bannerStyle, children, aside }: Props) {
  return (
    <div className="bg-card overflow-hidden rounded-md border">
      {bannerStyle
        ? <div className="h-14" style={bannerStyle} />
        : <div className="from-muted h-14 bg-gradient-to-r to-transparent" />}
      <div className="flex items-end gap-3 px-4 pb-4">
        <div className="flex min-w-0 flex-col items-start gap-3">
          {emblem}
          <div className="space-y-1.5">
            <h1 className="font-brand text-[28px] leading-none tracking-wide">{title}</h1>
            {children}
          </div>
        </div>
        {aside && <div className="ml-auto shrink-0">{aside}</div>}
      </div>
    </div>
  )
}
