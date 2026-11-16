import type { ReactNode } from 'react'

import type { WareraEntityKind } from '@/lib/warera/urls'

import { WareraLinkIcon } from '@/components/cells/warera-link-icon'

interface Props {
  kind: WareraEntityKind
  id: string
  children: ReactNode
}

/**
 * A table's first column: the entity's own cell, with its WarEra.io link
 * pinned right.
 */
export function IdentityCell({ kind, id, children }: Props) {
  return (
    <div className="flex items-center gap-2">
      {children}
      <WareraLinkIcon kind={kind} id={id} />
    </div>
  )
}
