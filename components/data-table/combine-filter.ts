/**
 * Combines a locked-in base filter (e.g. `muId:<id>` on a detail page, or
 * `countryCode:<code>` on the country page) with whatever the user typed in
 * the table's search box. The user's part is parenthesised so their own
 * OR/NOT can't escape the base scope.
 */
export function combineFilter(base: string | undefined, userFilter: string): string {
  if (!base) {
    return userFilter
  }
  return userFilter ? `${base} AND (${userFilter})` : base
}
