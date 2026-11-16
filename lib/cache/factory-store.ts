import path from 'node:path'

import { dataDir } from './file-store'
import { streamNdjson } from './ndjson'

/**
 * One factory's facts, captured by the all-users factory scrape. Production is
 * stored per source as points/day: the engine (from its level) and the NPC
 * employees (from the roster's hourly estimate), with the employee and manager
 * wages. The readers compute net, the engine/employee split and the Top potential
 * at build time from these plus the snapshot's market data. Self-work is not
 * modelled. Every number is optional; a line without the employee fields parses
 * as engine-only.
 */
export interface FactoryRawRow {
  itemCode: string
  regionId: string
  enginePoints?: number
  employeePoints?: number
  wagePerDay?: number
  managerPerDay?: number
  employeeCount?: number
  employeeCap?: number

  /**
   * The roster call failed, so the employee fields are unknown rather than zero.
   */
  rosterMissing?: true

  /**
   * The NPC roster, trimmed to what the users list aggregates.
   */
  employees?: FactoryRawEmployee[]
}

/**
 * One NPC employee as the factory scrape stores it. Stats are totals after
 * training and traits.
 */
export interface FactoryRawEmployee {
  production: number
  luck: number
  responsibility: number
  potential: number
  potentialMax: number
  happiness: number
  bonusPct: number
  age: number
  retireInDays: number
  wagePerHour: number
  pointsPerHour: number
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
