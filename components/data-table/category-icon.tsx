import type { Category } from './column-categories'

import { cn } from '@/lib/utils'

import { CATEGORY_META } from './column-categories'

/**
 * A category's icon in its color; General, which has none, is muted.
 */
export function CategoryIcon({ category, className }: { category: Category, className?: string }) {
  const { Icon, color } = CATEGORY_META[category]

  return (
    <Icon
      className={cn('size-3.5 shrink-0', !color && 'text-muted-foreground', className)}
      style={color ? { color } : undefined}
    />
  )
}
