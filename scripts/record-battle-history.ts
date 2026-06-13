import { recordBattleHistory } from '@/lib/cache/archive'
import { logger } from '@/lib/log'
import { getFinishedBattles } from '@/lib/warera/api'

const log = logger.child({ component: 'archive' })

async function main() {
  const battles = await getFinishedBattles()
  log.info({ battles: battles.length }, 'fetched finished battles from the API')

  const result = await recordBattleHistory(battles)
  log.info({ result }, 'archive done')
}

main().catch((err) => {
  log.error({ err }, 'archive failed')
  process.exit(1)
})
