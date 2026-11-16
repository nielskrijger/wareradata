import type { ComponentProps } from 'react'

import { Avatar } from '@/components/avatar'

/**
 * The avatar in a table cell. The negative margin keeps it within the row
 * height the cell text sets, so rows stay compact.
 */
export function TableAvatar(props: Omit<ComponentProps<typeof Avatar>, 'size' | 'className'>) {
  return <Avatar {...props} size={26} className="-my-0.5" />
}
