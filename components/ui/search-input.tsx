import type { ComponentProps } from 'react'

import { Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchInputProps extends Omit<ComponentProps<'input'>, 'type'> {
  /**
   * Shows a clear button while the field has a value.
   */
  onClear?: () => void
}

/**
 * Input with a leading search icon and an optional clear button.
 */
export function SearchInput({ className, onClear, value, ...props }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
      <Input
        type="text"
        value={value}
        className={cn('pl-8.5', onClear && 'pr-8')}
        {...props}
      />
      {onClear && value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
