/**
 * Display name for a country's government type code:
 * `homelandFront` → `Homeland Front`. Null stays null.
 */
export function formatGovType(value: string | null): string | null {
  if (!value) {
    return null
  }
  const words = value.replace(/([a-z])([A-Z])/g, '$1 $2')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
