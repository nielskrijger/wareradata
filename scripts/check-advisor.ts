import { buildAdvice } from '@/lib/advisor/build'
import { advisorInputFromData } from '@/lib/advisor/input'
import { basePerHour, outputPerHour, RULES, wagePerHour } from '@/lib/advisor/model'
import { getAdviceData, getGameConfig, getItemPrices, managerPointValue } from '@/lib/warera/api'

/**
 * Re-checks the advisor's formulas against the game's own per-employee
 * estimates for the API key's owner, then prints the to-do list
 * (`npm run check-advisor`). A failed check means a patch changed a rule.
 */
async function main() {
  const [data, gameConfig, prices] = await Promise.all([getAdviceData(), getGameConfig(), getItemPrices()])
  if (!data) {
    console.error('the API key owner has no employees')
    process.exit(1)
  }

  let failures = 0
  const check = (label: string, ours: number, theirs: number, tolerance: number) => {
    const ok = Math.abs(ours - theirs) <= tolerance
    if (!ok) {
      failures++
    }

    console.info(`${ok ? 'ok  ' : 'FAIL'} ${label}: ours ${ours.toFixed(4)}, game ${theirs.toFixed(4)}`)
  }

  for (const f of data.factories) {
    for (const e of f.employees) {
      check(`${e.name} output/h`, outputPerHour(e), e.estimate?.production ?? 0, 0.01)
      check(`${e.name} wage/h`, wagePerHour(e, data.ppValue), e.estimate?.wage ?? 0, 0.0005)
    }

    if (f.employees.length) {
      const base = f.employees.filter(e => !e.companyDisabled).reduce((s, e) => s + basePerHour(e), 0)
      const game = await managerPointValue(f.company._id)
      check(`${f.company.name} manager point`, base * RULES.managementPctPerPoint / 100, game, 0.01)
    }
  }

  const result = buildAdvice(advisorInputFromData(data, gameConfig, prices))
  console.info(`\nwages ${result.hourlyCost.toFixed(3)}/h`)
  for (const item of result.items) {
    const gain = (item.gainPerDay?.toFixed(2) ?? '-').padStart(7)
    console.info(`${gain}  ${String(item.energy).padStart(3)}e  ${item.title}\n          ${item.why}`)
  }

  for (const s of result.skipped) {
    console.info(`   skip  ${s.title}: ${s.why}`)
  }

  console.info(`\n${failures ? `${failures} checks FAILED` : 'all checks passed'}`)
  process.exit(failures ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
