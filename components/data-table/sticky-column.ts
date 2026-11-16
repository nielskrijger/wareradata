import type { CSSProperties } from 'react'

/**
 * Pins the first column while the rest scroll horizontally. bg-table-surface
 * matches the table fill (opaque, so scrolled columns don't bleed through);
 * a soft right-edge shadow signals the pin without recoloring the column.
 */
const PINNED = 'bg-table-surface sticky left-0 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.35)]'

/**
 * The header sits above the body's sticky cells so the top-left corner stays on top.
 */
export const STICKY_HEAD = `${PINNED} z-20`
export const STICKY_CELL = `${PINNED} z-10`

/**
 * Narrow on mobile to leave room for the data columns. A CSS var, not an inline
 * width, so the responsive classes can still win.
 */
export const STICKY_WIDTH = 'w-[140px] sm:w-[var(--col-w)]'

export function columnWidthStyle(width: number | undefined, sticky: boolean): CSSProperties | undefined {
  if (!width) {
    return undefined
  }

  return sticky ? { '--col-w': `${width}px` } as CSSProperties : { width: `${width}px` }
}
