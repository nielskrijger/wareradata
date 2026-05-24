interface Props {
  value: number | null | undefined
}

/**
 * Compact number formatter ("1.2K", "85.0K", "1.5M") that always renders
 * one decimal so digits line up across rows.
 */
const compactNumber = new Intl.NumberFormat('en', {
  notation: 'compact',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/**
 * Renders a compact number with the magnitude unit (K/M/B) muted and slotted
 * into a fixed-width right slot so units stack vertically across rows.
 */
export function CompactNumber({ value }: Props) {
  if (value === null || value === undefined) {
    return <>—</>
  }
  const text = compactNumber.format(value)
  const match = text.match(/^([\d.,]+)([A-Z]+)$/i)
  if (!match) {
    return <>{text}</>
  }
  return (
    <span className="inline-flex items-baseline">
      <span>{match[1]}</span>
      <span className="text-muted-foreground w-4 pl-0.5 text-left">{match[2]}</span>
    </span>
  )
}
