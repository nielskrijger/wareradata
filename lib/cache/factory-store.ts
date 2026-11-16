import path from 'node:path'

import { dataDir } from './file-store'
import { streamNdjson } from './ndjson'

/**
 * One factory's production per source and its wages, as captured. Net and
 * potential are computed at build time from these plus market prices.
 *
 * A line without the employee fields parses as engine-only.
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
 * One {@link FactoryUserLine} per line, so the scrape can append per user and
 * the build can stream it without holding every row.
 */
export function factoriesNdjsonPath(): string {
  return path.join(dataDir(), 'factories.ndjson')
}

/**
 * The pass in progress, renamed over {@link factoriesNdjsonPath} when it completes.
 */
export function factoriesPartialPath(): string {
  return path.join(dataDir(), 'factories.partial.ndjson')
}

/**
 * The last owner id the pass in progress has written, so a restart resumes after it.
 */
export function factoriesCursorPath(): string {
  return path.join(dataDir(), 'factories.cursor')
}

/**
 * Streams the factory file line by line, invoking `onUser` per record.
 */
export function streamFactoryUsers(onUser: (line: FactoryUserLine) => void): Promise<void> {
  return streamNdjson(factoriesNdjsonPath(), onUser)
}
