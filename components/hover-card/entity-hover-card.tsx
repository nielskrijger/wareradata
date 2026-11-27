'use client'

import type { ReactNode } from 'react'

import { HoverCardError } from '@/components/hover-card/hover-card-parts'
import { useEntityHover } from '@/components/hover-card/use-entity-hover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props<T> {
  /**
   * The details endpoint, fetched on first open. When null the children render
   * bare (no entity to look up, no tooltip).
   */
  url: string | null

  /**
   * Classes for the trigger wrapper span. A truncating child wants
   * `block min-w-0 flex-1`; an inline trigger (e.g. a flag) wants `inline-flex`.
   */
  triggerClassName?: string

  /**
   * The trigger element (the hovered cell).
   */
  children: ReactNode

  /**
   * The popup body once the details have loaded.
   */
  renderBody: (data: T) => ReactNode

  /**
   * Shown while loading, sized like the body so the popup doesn't jump.
   */
  skeleton: ReactNode
}

/**
 * The shared tooltip for the entity hover cards: fetches the entity's details
 * on first open and shows a skeleton, the body or an error line.
 */
export function EntityHoverCard<T>({
  url,
  triggerClassName = 'block min-w-0',
  children,
  renderBody,
  skeleton,
}: Props<T>) {
  const { status, data, onOpenChange } = useEntityHover<T>(url)

  if (!url) {
    return <>{children}</>
  }

  let content = skeleton
  if (status === 'error') {
    content = <HoverCardError />
  } else if (status === 'ready' && data) {
    content = renderBody(data)
  }

  return (
    <Tooltip onOpenChange={onOpenChange}>
      {/* The trigger span needs min-w-0 (and usually flex-1) so a truncating
          child can shrink: as a flex item it otherwise keeps its content's
          min-content width and the inner `truncate` never engages. */}
      <TooltipTrigger render={<span className={triggerClassName} />}>{children}</TooltipTrigger>
      <TooltipContent side="top" className="w-80 p-0">{content}</TooltipContent>
    </Tooltip>
  )
}
