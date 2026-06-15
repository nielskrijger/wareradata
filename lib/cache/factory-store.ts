import path from 'node:path'

import { dataDir } from './file-store'
import { streamNdjson } from './ndjson'

/**
 * One factory's slow-changing facts, captured by the all-users factory scrape.
 * Production is stored as theoretical per-source points/day (engine + employees
 * at full daily effort, computed at scrape time from engine level + worker
 * skills); the readers exclude self-work and compute net, the engine/employee
 * split, and the Move/Top potentials at build time from these plus the snapshot's
 * market data (prices + best-region frontier).
 */
export interface FactoryRawRow {
  itemCode: string
  regionId: string
  bonusPct: number
  // Theoretical production points/day per source (post-bonus): the engine at its
  // level, and workers clicking to full energy daily (loyalty cap). Self-work is
  // not modelled — it's the owner's discretionary labour, not tied to a factory.
  enginePoints: number
  employeePoints: number
  grossWagePerDay: number
  workerCount: number
  // Legacy: pre-split lines stored a single combined points/day. Read-only
  // fallback so Net/day keeps working until the next pass rewrites the file in
  // the per-source shape; remove once one pass has run in each environment.
  pointsPerDay?: number
}

/**
 * One NDJSON line of the factory file: a user id + their factory rows.
 */
export interface FactoryUserLine {
  userId: string
  rows: FactoryRawRow[]
}

/**
 * The factory scrape's output: newline-delimited JSON, one {@link FactoryUserLine}
 * per line. NDJSON so the scrape can append per user (no in-memory accumulator)
 * and the snapshot build can stream it line by line (only the small per-user
 * aggregate is retained, never all raw rows at once).
 */
export function factoriesNdjsonPath(): string {
  return path.join(dataDir(), 'factories.ndjson')
}

/**
 * Streams the factory file line by line, invoking `onUser` per record.
 */
export function streamFactoryUsers(onUser: (line: FactoryUserLine) => void): Promise<void> {
  return streamNdjson(factoriesNdjsonPath(), onUser)
}
