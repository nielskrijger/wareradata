'use client'

import Link from 'next/link'

import { TableAvatar } from '@/components/cells/table-avatar'
import { EmptyDash } from '@/components/empty-dash'
import { InternalLink } from '@/components/links'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const KINDS = {
  mu: { path: '/mus', filter: 'mu', label: 'Military unit' },
  party: { path: '/parties', filter: 'party', label: 'Party' },
} as const

interface Props {
  kind: keyof typeof KINDS
  name: string | null

  /**
   * Links to the detail page when set. Without it the name links to /users
   * filtered to the group, for places that only know the name.
   */
  id?: string | null

  /**
   * Shown in front of the name when set. Groups have no color scheme, so the
   * avatar never gets a ring.
   */
  avatarUrl?: string | null

  /**
   * Medium weight, for when the group is the row's primary identifier.
   */
  bold?: boolean

  /**
   * Shown as a small flag on the avatar.
   */
  countryCode?: string | null

  /**
   * Only the avatar, with the name in a tooltip, to keep a secondary column
   * narrow. Needs `avatarUrl`.
   */
  iconOnly?: boolean
}

/**
 * An MU or party: avatar and linked name.
 */
export function GroupCell({ kind, name, id, avatarUrl, bold, countryCode, iconOnly }: Props) {
  if (!name) {
    return <EmptyDash />
  }

  const { path, filter, label } = KINDS[kind]
  // Quoted, since group names often contain spaces.
  const href = id ? `${path}/${id}` : `/users?q=${encodeURIComponent(`${filter}:"${name}"`)}`

  if (iconOnly && avatarUrl !== undefined) {
    return (
      <Tooltip>
        <TooltipTrigger render={<Link href={href} aria-label={name} className="inline-flex align-middle" />}>
          <TableAvatar src={avatarUrl} name={name} />
        </TooltipTrigger>
        <TooltipContent className="max-w-64">
          <div className="text-sm font-medium">{name}</div>
          <div className="text-neutral-400">{label}</div>
        </TooltipContent>
      </Tooltip>
    )
  }

  const link = (
    <InternalLink href={href} bold={bold} title={name} className="truncate">
      {name}
    </InternalLink>
  )

  if (avatarUrl === undefined) {
    return link
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <TableAvatar src={avatarUrl} name={name} countryCode={countryCode} />
      {link}
    </div>
  )
}
