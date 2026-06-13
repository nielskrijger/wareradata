import path from 'node:path'

import { dataDir, readJsonFile } from './file-store'

/**
 * One factory's raw, slow-changing facts, captured by the all-users factory
 * scrape. Net/profit and the Move/Top potentials are NOT stored — the row
 * builders compute them at build time from these plus the snapshot's market
 * data (prices + best-region frontier), the same way other rows derive their
 * values from raw API data.
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
 * The factory scrape's output: raw factory rows keyed by owner user id.
 */
export interface FactorySnapshot {
  byUser: Record<string, FactoryRawRow[]>
}

export function factorySnapshotPath(): string {
  return path.join(dataDir(), 'factories.json')
}

/**
 * Reads the raw factory snapshot, or an empty one when the slow scrape hasn't
 * run yet (the MU / Country / Alliance factory columns then read as empty).
 */
export function readFactorySnapshot(): Promise<FactorySnapshot> {
  return readJsonFile<FactorySnapshot>(factorySnapshotPath(), { byUser: {} })
}
