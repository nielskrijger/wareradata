import type { ReactNode } from 'react'
import { PageMain } from '@/components/layout/page-main'
import { Panel } from '@/components/panel'

interface Props {
  /**
   * Colour washed in behind the avatar, faded out after the header.
   */
  wash: string
  avatar: ReactNode

  /**
   * The refresh control, pinned top-right next to the avatar.
   */
  refresh: ReactNode
  children: ReactNode
}

/**
 * The left column of a detail page (user, MU): avatar and refresh on top, then
 * the identity and sections the caller passes in.
 */
export function DetailSidebar({ wash, avatar, refresh, children }: Props) {
  return (
    <Panel
      as="aside"
      className="flex flex-col gap-4 self-start"
      style={{ backgroundImage: `linear-gradient(180deg, ${wash}, transparent 9rem)` }}
    >
      <div className="flex items-start justify-between gap-2">
        {avatar}
        {refresh}
      </div>
      {children}
    </Panel>
  )
}

/**
 * The entity's name with its badges beside it.
 */
export function SidebarTitle({ name, children }: { name: string, children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h1 className="font-brand text-[32px] leading-none tracking-wide break-all">{name}</h1>
      {children}
    </div>
  )
}

export function SidebarSection({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2 border-t pt-4">{children}</div>
}

/**
 * One label / value line of the sidebar's fact list; wrap them in a <dl>.
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
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </PageMain>
  )
}
