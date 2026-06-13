'use client'

import type { ReactNode } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  // When false the children render bare (no entity to look up, no tooltip).
  enabled: boolean
  // Classes for the trigger wrapper span. A truncating child wants
  // `block min-w-0 flex-1`; an inline trigger (e.g. a flag) wants `inline-flex`.
  triggerClassName: string
  // Classes for the tooltip popup (width, padding).
  contentClassName: string
  // Wire to the lazy fetch via `useEntityHover().onOpenChange`.
  onOpenChange: (open: boolean) => void
  // The trigger element (the hovered cell).
  children: ReactNode
  // The popup body, already chosen by the caller from its fetch status.
  content: ReactNode
}

/**
 * The shared tooltip wrapper for the entity hover cards: trigger + popup, with
 * a bare passthrough when disabled. Pairs with {@link useEntityHover}, which
 * supplies `onOpenChange` and the status that picks the `content`.
 */
export function HoverCardShell({ enabled, triggerClassName, contentClassName, onOpenChange, children, content }: Props) {
  if (!enabled) {
    return <>{children}</>
  }

  return (
    <Tooltip onOpenChange={onOpenChange}>
      {/* The trigger span needs min-w-0 (and usually flex-1) so a truncating
          child can shrink: as a flex item it otherwise keeps its content's
          min-content width and the inner `truncate` never engages. */}
      <TooltipTrigger render={<span className={triggerClassName} />}>{children}</TooltipTrigger>
      <TooltipContent side="top" className={contentClassName}>{content}</TooltipContent>
    </Tooltip>
  )
}
