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
   * Optional node rendered inline to the right of the title, vertically centered
   * against it (e.g. a user's level-tier badge). Omitted, the title sits alone.
   */
  titleSuffix?: ReactNode

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
   * A full-width band below the facts, outside the padded column so its top
   * divider reaches both edges.
   */
  footer?: ReactNode

  /**
   * A control pinned top-right that overlays the content, so it never shifts
   * the layout; keep it narrow enough to clear the title.
   */
  aside?: ReactNode
}

/**
 * Header for the detail pages: a banner strip with the emblem overlapping it,
 * the name, and the caller's fact rows.
 */
export function DetailHeader({ emblem, title, titleSuffix, bannerStyle, children, footer, aside }: Props) {
  return (
    <div className="bg-card relative overflow-hidden rounded-md border">
      {bannerStyle
        ? <div className="h-14" style={bannerStyle} />
        : <div className="from-muted h-14 bg-gradient-to-r to-transparent" />}
      {aside && <div className="absolute top-0 right-4 z-10 flex h-14 items-center">{aside}</div>}
      <div className="flex items-end gap-3 px-4 pb-4">
        <div className="flex min-w-0 flex-col items-start gap-3">
          {emblem}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h1 className="font-brand text-[28px] leading-none tracking-wide">{title}</h1>
              {titleSuffix && <span className="flex items-center gap-2 -translate-y-0.5">{titleSuffix}</span>}
            </div>
            {children}
          </div>
        </div>
      </div>
      {footer && <div className="border-t px-4 pt-4 pb-3">{footer}</div>}
    </div>
  )
}
