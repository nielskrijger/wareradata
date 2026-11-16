import type { AdvisorInput, Bar } from './build'
import type { ItemPrices } from '@/lib/factories/profit'
import type { AdviceData, GameConfig } from '@/lib/warera/api'

import { humanizeItem } from '@/components/factories/format'
import { buildEngineModel, enginePointsPerDay } from '@/lib/factories/engine'
import { engineLevelOf, recipeFromGameConfig } from '@/lib/factories/inputs'

import { RULES } from './model'

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
  now: Date,
): AdvisorInput {
  const model = buildEngineModel(gameConfig)
  const skills = data.user.skills
  const wealth = (data.user.stats as { wealth?: { money?: number } } | undefined)?.wealth

  return {
    companies: data.factories.map((f, i) => {
      const m = data.managers[i]

      return {
        id: f.company._id,
        // Players often name companies with just a number.
        name: `${humanizeItem(f.company.itemCode)} ${f.company.name}`,
        itemCode: f.company.itemCode,
        employeeCap: f.hourly?.cap ?? 0,
        enginePointsPerDay: enginePointsPerDay(engineLevelOf(f), model, f.hourly?.engineMultiplier ?? 1),
        employees: f.employees,
        manager: m
          ? { hourlyWage: m.hourlyWage, productionBonusPercent: m.productionBonusPercent, canEndAt: m.canEndAt }
          : null,
      }
    }),
    ppValue: data.ppValue,
    prices,
    recipe: recipeFromGameConfig(gameConfig),
    ownerManagementPct: (skills.management?.total ?? 0) * RULES.managementPctPerPoint,
    energy: bar(skills.energy),
    production: bar(skills.production),
    cash: wealth?.money ?? null,
    managerMarketWage: data.managerMarketWage,
    changeItemCost: gameConfig.company?.changeItemCost ?? 0,
    now,
  }
}
