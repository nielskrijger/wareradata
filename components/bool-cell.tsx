interface Props {
  value: boolean | null | undefined
  // What to render when the value is false. 'no' colors a red "No";
  // 'dash' renders a muted em-dash for facts where only the true state
  // is meaningful (e.g. a region being a capital).
  falsy?: 'no' | 'dash'
}

/**
 * Renders a boolean as colored text: green "Yes" for true, and either a
 * red "No" or a muted em-dash for false.
 */
export function BoolCell({ value, falsy = 'no' }: Props) {
  if (value) {
    return <span className="font-medium text-green-700 dark:text-green-400">Yes</span>
  }

  if (falsy === 'dash') {
    return <span className="text-muted-foreground">—</span>
  }

  return <span className="font-medium text-red-700 dark:text-red-400">No</span>
}
