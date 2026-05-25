/**
 * WarEra's user-selectable profile color schemes, as exact RGB values pulled
 * from the in-game color picker. The API returns the scheme name in camelCase
 * (e.g. `deepOrange`, `lightBlue`) on `user.infos.colorScheme`; keys here match
 * that form. The palette is intentionally desaturated, so even a full-strength
 * band reads as tasteful rather than garish.
 */
const SCHEME_RGB: Record<string, string> = {
  red: '184, 50, 52',
  deepOrange: '198, 73, 57',
  orange: '194, 95, 53',
  lightOrange: '196, 132, 59',
  amber: '173, 136, 57',
  yellow: '161, 150, 56',
  olive: '142, 144, 111',
  lime: '111, 139, 77',
  lightGreen: '79, 149, 75',
  green: '54, 138, 85',
  emerald: '54, 163, 112',
  teal: '48, 156, 136',
  cyan: '57, 138, 147',
  lightBlue: '32, 141, 223',
  blue: '46, 97, 209',
  indigo: '83, 64, 191',
  purple: '117, 74, 181',
  violet: '139, 77, 178',
  pink: '178, 77, 155',
  deepPink: '192, 63, 88',
  brown: '137, 123, 118',
  sand: '135, 136, 119',
  gray: '105, 131, 150',
}

// Used when a user hasn't picked a scheme or it's unknown — the neutral gray.
const FALLBACK_RGB = SCHEME_RGB.gray

/**
 * Resolves a colorScheme name to its `r, g, b` triplet (for use in `rgb()` /
 * `rgba()`), falling back to the neutral gray for null/unknown values.
 */
export function schemeRgb(scheme: string | null | undefined): string {
  if (scheme && scheme in SCHEME_RGB) {
    return SCHEME_RGB[scheme]
  }
  return FALLBACK_RGB
}
