import {
  mdiAccount,
  mdiAccountGroup,
  mdiAccountHeart,
  mdiAccountPlus,
  mdiAccountSupervisor,
  mdiAirplane,
  mdiAnchor,
  mdiArrowCollapse,
  mdiBank,
  mdiBookOpenPageVariant,
  mdiBoxingGlove,
  mdiCash,
  mdiCat,
  mdiCertificate,
  mdiClipboardCheck,
  mdiClover,
  mdiDiamond,
  mdiDiceMultiple,
  mdiDramaMasks,
  mdiEarth,
  mdiEmoticonSick,
  mdiExitRun,
  mdiFlag,
  mdiFlagVariant,
  mdiHammer,
  mdiHammerWrench,
  mdiHandshake,
  mdiHome,
  mdiHumanFemaleFemale,
  mdiHumanMaleMale,
  mdiIncognito,
  mdiMedal,
  mdiPiggyBank,
  mdiRecycle,
  mdiRepeat,
  mdiRobotHappy,
  mdiShieldAccount,
  mdiShovel,
  mdiSprout,
  mdiSwordCross,
  mdiWarehouse,
  mdiWhistle,
} from '@mdi/js'

export type TraitGroup = 'gold' | 'blue' | 'green' | 'red'

/**
 * Shapes and colours as warera.io draws its trait markers (100×100 viewBox).
 */
export const TRAIT_GROUPS: Record<TraitGroup, { shape: string, icon: string, body: string, iconOffset: number }> = {
  gold: {
    shape: 'M55.15 5.46L99.65 86.71Q104.8 96.11 94.08 96.11L5.92 96.11Q-4.8 96.11 0.35 86.71L44.85 5.46Q50 -3.95 55.15 5.46Z',
    icon: 'var(--heat-gold)',
    body: '#30240C',
    // Triangles are bottom-heavy, so the icon sits lower to look centred.
    iconOffset: 3,
  },
  blue: {
    shape: 'M54.33 1.42L89.91 21.96Q94.25 24.46 94.25 29.46L94.25 70.54Q94.25 75.54 89.91 78.04L54.33 98.58Q50 101.09 45.67 98.58L10.09 78.04Q5.75 75.54 5.75 70.54L5.75 29.46Q5.75 24.46 10.09 21.96L45.67 1.42Q50 -1.09 54.33 1.42Z',
    icon: 'var(--heat-blue)',
    body: '#11244C',
    iconOffset: 0,
  },
  green: {
    shape: 'M50 1A49 49 0 1 1 50 99A49 49 0 1 1 50 1Z',
    icon: 'var(--heat-green)',
    body: '#092E1E',
    iconOffset: 0,
  },
  red: {
    shape: 'M58.78 2.46L97.54 41.22Q106.32 50 97.54 58.78L58.78 97.54Q50 106.32 41.22 97.54L2.46 58.78Q-6.32 50 2.46 41.22L41.22 2.46Q50 -6.32 58.78 2.46Z',
    icon: 'var(--heat-red)',
    body: '#431416',
    iconOffset: 0,
  },
}

export const BODY_END = '#121C1E'
export const OUTLINE = '#090E0F'
export const ICON_SHADOW = '#050607'

/**
 * Trait codes the game has been seen to draw; others fall back to a text badge.
 */
export const TRAITS: Record<string, { icon: string, group: TraitGroup }> = {
  anchor: { icon: mdiAnchor, group: 'blue' },
  bandOfBrothers: { icon: mdiShieldAccount, group: 'gold' },
  bully: { icon: mdiBoxingGlove, group: 'red' },
  claustrophobe: { icon: mdiArrowCollapse, group: 'red' },
  comic: { icon: mdiDramaMasks, group: 'blue' },
  cosmopolitan: { icon: mdiEarth, group: 'gold' },
  craftsman: { icon: mdiHammerWrench, group: 'gold' },
  creatureOfHabit: { icon: mdiRepeat, group: 'red' },
  diamondInTheRough: { icon: mdiDiamond, group: 'green' },
  earlyBloomer: { icon: mdiSprout, group: 'green' },
  expat: { icon: mdiAirplane, group: 'gold' },
  flightRisk: { icon: mdiExitRun, group: 'red' },
  foreman: { icon: mdiClipboardCheck, group: 'blue' },
  gambler: { icon: mdiDiceMultiple, group: 'red' },
  girlPower: { icon: mdiHumanFemaleFemale, group: 'gold' },
  greedy: { icon: mdiCash, group: 'red' },
  handy: { icon: mdiHammer, group: 'gold' },
  homesick: { icon: mdiHome, group: 'red' },
  jinx: { icon: mdiCat, group: 'red' },
  laborer: { icon: mdiShovel, group: 'gold' },
  loner: { icon: mdiAccount, group: 'gold' },
  loyal: { icon: mdiHandshake, group: 'blue' },
  luckyCharm: { icon: mdiClover, group: 'green' },
  mentor: { icon: mdiAccountSupervisor, group: 'blue' },
  misogynist: { icon: mdiHumanMaleMale, group: 'red' },
  modest: { icon: mdiPiggyBank, group: 'green' },
  nationalist: { icon: mdiFlag, group: 'gold' },
  oldFriends: { icon: mdiAccountHeart, group: 'gold' },
  patriot: { icon: mdiFlagVariant, group: 'gold' },
  quickStudy: { icon: mdiBookOpenPageVariant, group: 'green' },
  recruiter: { icon: mdiAccountPlus, group: 'blue' },
  rival: { icon: mdiSwordCross, group: 'gold' },
  salvager: { icon: mdiRecycle, group: 'green' },
  sociable: { icon: mdiAccountGroup, group: 'gold' },
  specialist: { icon: mdiCertificate, group: 'gold' },
  statist: { icon: mdiBank, group: 'gold' },
  stockpiler: { icon: mdiWarehouse, group: 'green' },
  talksToMachines: { icon: mdiRobotHappy, group: 'gold' },
  taxShy: { icon: mdiIncognito, group: 'red' },
  trainer: { icon: mdiWhistle, group: 'green' },
  veteran: { icon: mdiMedal, group: 'green' },
  wornOut: { icon: mdiEmoticonSick, group: 'red' },
}

export function hasTraitIcon(code: string): boolean {
  return code in TRAITS
}
