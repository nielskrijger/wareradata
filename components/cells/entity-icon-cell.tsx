'use client'

import Link from 'next/link'

import { TableAvatar } from '@/components/cells/table-avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  href: string
  name: string
  avatarUrl: string | null

  /**
   * What the entity is, shown under the name in the tooltip (e.g. "Party").
   */
  kind: string
}

/**
 * An MU or party as just its avatar, linked, with the name in a tooltip. Keeps
 * the column narrow in tables where the name is secondary.
 */
export function EntityIconCell({ href, name, avatarUrl, kind }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Link href={href} aria-label={name} className="inline-flex align-middle" />}>
        <TableAvatar src={avatarUrl} name={name} />
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-neutral-400">{kind}</div>
      </TooltipContent>
    </Tooltip>
  )
}
