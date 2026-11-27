import type { ReactNode } from 'react'

import type { WareraEntityKind } from '@/lib/warera/urls'

import { HighlightedPlayerProvider } from '@/components/detail/rank-map/member-ticks'
import { PageMain } from '@/components/layout/page-main'
import { ExternalLink } from '@/components/links'
import { Panel } from '@/components/panel'
import { wareraUrl } from '@/lib/warera/urls'

interface Props {
  /**
   * Colour washed in behind the avatar, faded out after the header.
   */
  wash: string
  avatar: ReactNode

  /**
   * The refresh control, pinned to the card's top-right corner, for entities
   * that can be re-fetched on demand.
   */
  refresh?: ReactNode
  children: ReactNode
}

/**
 * The left column of a detail page: avatar and refresh on top, then
 * the identity and sections the caller passes in.
 *
 * From xl up the card drops by the height of a tab row plus its gap, so it
 * lines up with the first card under a page's tabs, and the avatar breaks out
 * of its top edge into that space.
 */
export function DetailSidebar({ wash, avatar, refresh, children }: Props) {
  return (
    <Panel
      as="aside"
      className="relative flex flex-col gap-4 self-start xl:mt-[50px]"
      style={{ backgroundImage: `linear-gradient(180deg, ${wash}, transparent 9rem)` }}
    >
      <div className="xl:-mt-[70px]">{avatar}</div>
      {refresh && <div className="absolute top-4 right-4 sm:top-5 sm:right-5">{refresh}</div>}
      {children}
    </Panel>
  )
}

interface IdentityProps {
  name: string

  /**
   * Shown beside the name (tier, status).
   */
  badges?: ReactNode
  kind: WareraEntityKind
  id: string

  /**
   * The {@link Fact} rows.
   */
  children: ReactNode
}

/**
 * The sidebar's top block: name and badges, the fact list, and the WarEra.io link.
 */
export function SidebarIdentity({ name, badges, kind, id, children }: IdentityProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-brand text-[32px] leading-none tracking-wide break-all">{name}</h1>
        {badges}
      </div>
      <dl className="space-y-1 text-sm">{children}</dl>
      <ExternalLink href={wareraUrl(kind, id)}>WarEra.io</ExternalLink>
    </div>
  )
}

export function SidebarSection({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2 border-t pt-4">{children}</div>
}

/**
 * One label / value line of a sidebar fact list.
 */
export function Fact({ label, children }: { label: string, children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="flex min-w-0 justify-end text-right">{children}</dd>
    </div>
  )
}

/**
 * Sidebar left, everything else stacked on the right from xl up.
 */
export function DetailLayout({ sidebar, children }: { sidebar: ReactNode, children: ReactNode }) {
  return (
    <PageMain className="grid grid-cols-1 gap-4 xl:grid-cols-[23.5rem_minmax(0,1fr)]">
      {sidebar}
      <div className="flex min-w-0 flex-col gap-4">
        <HighlightedPlayerProvider>{children}</HighlightedPlayerProvider>
      </div>
    </PageMain>
  )
}
