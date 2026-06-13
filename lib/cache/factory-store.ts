import path from 'node:path'

import { dataDir } from './file-store'
import { streamNdjson } from './ndjson'

/**
 * One factory's raw, slow-changing facts, captured by the all-users factory
 * scrape. Net/profit and the Move/Top potentials are NOT stored — the row
 * builders compute them at build time from these plus the snapshot's market
 * data (prices + best-region frontier).
 */
export interface FactoryRawRow {
  itemCode: string
  regionId: string
  bonusPct: number
  pointsPerDay: number
  grossWagePerDay: number
  workerCount: number
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
