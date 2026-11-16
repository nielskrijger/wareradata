export const SHARE_SIZE = { width: 1200, height: 630 }

/**
 * Hex approximations of the brand's oklch fire gradient, which Satori can't parse.
 */
export const ORANGE = '#f5a623'
export const FIRE = 'linear-gradient(90deg, #ee8a1f, #fbbd2a, #ee8a1f)'
export const MUTED = '#a3a3a3'

const TANK_SVG = `<svg viewBox="2 8 28 14" xmlns="http://www.w3.org/2000/svg" fill="${ORANGE}">
  <path d="M3 17 L29 17 L27 14 L5 14 Z"/>
  <circle cx="7" cy="19" r="2.5"/><circle cx="13" cy="19" r="2.5"/>
  <circle cx="19" cy="19" r="2.5"/><circle cx="25" cy="19" r="2.5"/>
  <rect x="10" y="9" width="10" height="5" rx="1"/>
  <path d="M20 11.5 L24 11.5 L26 8.5 L29 9.5" fill="none"
    stroke="${ORANGE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="29" cy="9.5" r="1.1"/>
</svg>`

export const TANK_SRC = `data:image/svg+xml,${encodeURIComponent(TANK_SVG)}`
