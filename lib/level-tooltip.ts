export interface LevelSummary {
  level: number | null
  levelRank: number | null
  prestige: number | null
  prestigePoints: number | null
  totalXp: number | null
}

/**
 * Tooltip lines for a player's level. The rank is on lifetime XP, so the
 * prestige and XP lines explain why a lower level can rank higher.
 */
export function levelTooltipLines(u: LevelSummary, rankedTotal?: number): string[] {
  const lines: string[] = []
  if (u.levelRank != null) {
    lines.push(rankedTotal != null
      ? `Rank #${u.levelRank.toLocaleString()} of ${rankedTotal.toLocaleString()}`
      : `Rank #${u.levelRank.toLocaleString()}`)
  } else {
    lines.push('Unranked')
  }
  if (u.prestige) {
    lines.push(`Prestige ${u.prestige}`)
  }
  if (u.prestigePoints) {
    lines.push(`${u.prestigePoints} unspent prestige ${u.prestigePoints === 1 ? 'point' : 'points'}`)
  }
  if (u.totalXp != null) {
    lines.push(`${u.totalXp.toLocaleString()} lifetime XP`)
  }
  return lines
}
