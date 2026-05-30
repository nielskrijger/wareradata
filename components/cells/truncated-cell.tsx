import { cn } from '@/lib/utils'

interface Props {
  text: string
  className?: string
}

/**
 * Truncates `text` to its (fixed-width) parent column with an ellipsis,
 * exposing the full value via the native browser tooltip. Use inside a
 * `table-layout: fixed` cell where the column width is the constraint.
 */
export function TruncatedCell({ text, className }: Props) {
  return (
    <span title={text} className={cn('block truncate', className)}>
      {text}
    </span>
  )
}
