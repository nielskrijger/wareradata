import path from 'node:path'

import { dataDir } from './file-store'
import { streamNdjson } from './ndjson'

/**
 * One factory's raw, slow-changing facts, captured by the all-users factory
 * scrape. Stored as raw per-source production points (no derived totals or net) —
 * the readers decide what to include (e.g. exclude self-work) and compute net,
 * the engine/employee split, and the Move/Top potentials at build time from these
 * plus the snapshot's market data (prices + best-region frontier).
 */
export interface FactoryRawRow {
  itemCode: string
  regionId: string
  bonusPct: number
  // Average production points/day per source (complete days). Self-work is kept
  // raw here but excluded from net by the readers (it's the owner's discretionary
  // labour, not tied to the factory).
  enginePoints: number
  employeePoints: number
  selfPoints: number
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
