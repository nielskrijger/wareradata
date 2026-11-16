import type { BattleDetail } from '@/lib/rows'

import { cacheLife } from 'next/cache'

import { logger } from '@/lib/log'
import { buildBattleDetail } from '@/lib/rows/build-battle-detail'
import { getBattleExtras } from '@/lib/warera/api'

import { getSnapshot } from './memory'

// Build-time guard: holds the WarEra API key path; server-only.
import 'server-only'

const log = logger.child({ component: 'battle-detail' })

/**
 * A battle's rounds, rankings, orders and contracts, cached for a minute like
 * the live battle list.
 *
 * Null on a failed fetch, so the page still renders its header from the row.
 */
export async function getBattleDetail(id: string): Promise<BattleDetail | null> {
  'use cache'
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 })
  try {
    const [extras, snapshot] = await Promise.all([getBattleExtras(id), getSnapshot()])

    return buildBattleDetail(extras, snapshot.lookups)
  } catch (err) {
    log.warn({ err, id }, 'battle detail fetch failed')

    return null
  }
}
