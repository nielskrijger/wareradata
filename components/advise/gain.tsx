import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { GAIN, gain } from './format'

/**
 * A gold-per-day gain in the page's green mono, so every gain reads the same.
 */
export function Gain({ value, perDay, className, children }: {
  value: number
  perDay?: boolean
  className?: string
  children?: ReactNode
}) {
  return (
    <span className={cn('font-mono', className)} style={{ color: GAIN }}>
      {gain(value)}
      {perDay && ' g/day'}
      {children}
    </span>
  )
}
