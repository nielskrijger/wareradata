import { recordBattleHistory } from '@/lib/cache/archive'
import { getFinishedBattles } from '@/lib/warera/api'

async function main() {
  const battles = await getFinishedBattles()
  console.warn(`[archive] fetched ${battles.length} finished battles from the API`)

  const result = await recordBattleHistory(battles)
  console.warn('[archive] done', JSON.stringify(result))
}

main().catch((err) => {
  console.error('[archive] failed', err)
  process.exit(1)
})
