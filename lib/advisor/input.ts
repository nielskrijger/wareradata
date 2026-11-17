import type { AdvisorInput, Bar } from './types'
import type { ItemPrices } from '@/lib/factories/profit'
import type { AdviceData, GameConfig } from '@/lib/warera/api'

import { humanizeCode } from '@/components/factories/format'
import { buildEngineModel } from '@/lib/factories/engine'
import { factoryInputFromData, recipeFromGameConfig } from '@/lib/factories/inputs'
import { computeFactoryProfit } from '@/lib/factories/profit'
import { HOURS_PER_DAY } from './model'

interface BarSkill {
  currentBarValue?: number
  total?: number
  hourlyBarRegen?: number
}

function bar(skill: BarSkill | undefined): Bar {
  return { current: skill?.currentBarValue ?? 0, cap: skill?.total ?? 0, regenPerHour: skill?.hourlyBarRegen ?? 0 }
}

/**
 * Maps the fetched API data into the advisor's plain input.
 */
export function advisorInputFromData(
  data: AdviceData,
  gameConfig: GameConfig,
  prices: ItemPrices,
): AdvisorInput {
  const model = buildEngineModel(gameConfig)
  const skills = data.user.skills
  const wealth = (data.user.stats as { wealth?: { money?: number } } | undefined)?.wealth
  const recipe = recipeFromGameConfig(gameConfig)
  const itemTypes = (gameConfig.items ?? {}) as unknown as Record<string, { type?: string } | undefined>

  return {
    companies: data.factories.map((f, i) => {
      const m = data.managers[i]
      const profit = computeFactoryProfit(factoryInputFromData(f, () => '', model), prices, recipe, null)
      const output = profit.revenuePerDay - profit.inputCostPerDay

      return {
        id: f.company._id,
        // Players often name companies with just a number.
        name: `${humanizeCode(f.company.itemCode)} ${f.company.name}`,
        ownName: f.company.name,
        itemCode: f.company.itemCode,
        regionId: f.company.region,
        storageLevel: f.company.activeUpgradeLevels?.storage ?? 0,
        employeeCap: f.hourly?.cap ?? 0,
        enginePointsPerDay: profit.enginePointsPerDay,
        employees: f.employees,
        manager: m ? { hourlyWage: m.hourlyWage, productionBonusPercent: m.productionBonusPercent } : null,
        outputPerDay: output,
        engineOutputPerDay: profit.pointsPerDay > 0 ? output * profit.enginePointsPerDay / profit.pointsPerDay : 0,
        payrollPerDay: profit.wagePerDay + profit.managerPerDay,
        toolboxesPerDay: (f.hourly?.toolboxes ?? 0) * HOURS_PER_DAY,
      }
    }),
    ppValue: data.ppValue,
    prices,
    recipe,
    energy: bar(skills.energy),
    cash: wealth?.money ?? null,
    managerMarketWage: data.managerMarketWage,
    changeItemConcrete: gameConfig.company?.changeItemCost ?? 0,
    rawGoods: new Set(Object.keys(itemTypes).filter(code => itemTypes[code]?.type === 'raw')),
  }
}
