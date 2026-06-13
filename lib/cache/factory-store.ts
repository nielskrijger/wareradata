import { createReadStream } from 'node:fs'
import path from 'node:path'
import { createInterface } from 'node:readline'

import { dataDir } from './file-store'

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
 * Streams the factory file line by line, invoking `onUser` per record. Resolves
 * silently when the file doesn't exist yet (the slow scrape hasn't run). Skips
 * blank or unparseable lines (e.g. a torn final line from a crashed writer).
 */
export async function streamFactoryUsers(onUser: (line: FactoryUserLine) => void): Promise<void> {
  const rl = createInterface({
    input: createReadStream(factoriesNdjsonPath(), { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })

  try {
    for await (const line of rl) {
      if (!line.trim()) {
        continue
      }
      try {
        onUser(JSON.parse(line) as FactoryUserLine)
      } catch {
        // Skip a torn/partial line rather than failing the whole build.
      }
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err
    }
  }
}
