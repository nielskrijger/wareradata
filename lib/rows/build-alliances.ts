import type { AllianceMemberRow, AllianceRow, CountryRow, UserRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { Alliance } from '@/lib/warera/api'

import { rankAll, toTier } from '@/lib/rows/lookups'
import { aggMean, aggregateMembers } from '@/lib/rows/member-agg'

export function buildAllianceRows(alliances: Alliance[], countryRows: CountryRow[], userRows: UserRow[], lookups: Lookups): AllianceRow[] {
  const countryRowById = new Map(countryRows.map(c => [c.id, c]))

  // Aggregate the member countries' citizens per alliance for the points
  // stats, the same per-user aggregation the country/MU/party builders use.
  const allianceIdByCountry = new Map<string, string>()
  for (const a of alliances) {
    for (const m of a.memberCountries) {
      allianceIdByCountry.set(m.country, a._id)
    }
  }
  const citizensByAlliance = aggregateMembers(userRows, u => allianceIdByCountry.get(u.countryId) ?? null)

  const rows = alliances
    .map((a) => {
      const r = a.rankings
      const agg = citizensByAlliance.get(a._id)

      // Citizen wealth is the sum of the member countries' citizen-summed
      // figures. Countries partition users, so summing the already-aggregated
      // country rows equals aggregating the alliance's citizens directly.
      const wealth = { citizenWealth: 0, companiesWealth: 0, itemsWealth: 0, cashWealth: 0, equipmentWealth: 0, weaponsWealth: 0 }
      for (const m of a.memberCountries) {
        const c = countryRowById.get(m.country)
        if (!c) {
          continue
        }
        wealth.citizenWealth += c.citizenWealth
        wealth.companiesWealth += c.companiesWealth
        wealth.itemsWealth += c.itemsWealth
        wealth.cashWealth += c.cashWealth
        wealth.equipmentWealth += c.equipmentWealth
        wealth.weaponsWealth += c.weaponsWealth
      }

      // Resolve member country ids against the built country rows (name, flag
      // code, and the country stats the members table shows) and order the
      // roster by development contribution, the display order everywhere.
      const members: AllianceMemberRow[] = a.memberCountries
        .map((m) => {
          const c = countryRowById.get(m.country)
          return {
            countryId: m.country,
            code: c?.code ?? null,
            name: c?.name ?? 'Unknown',
            coreDevelopment: m.coreDevelopment,
            averageDevelopment: m.averageDevelopment,
            suspended: m.suspended,
            activePopulation: c?.activePopulation ?? null,
            weeklyDamage: c?.weeklyDamage ?? null,
            citizenWealth: c?.citizenWealth ?? null,
            avgLevel: c?.avgLevel ?? null,
            damageTier: c?.damageTier ?? null,
          }
        })
        .sort((x, y) => y.coreDevelopment - x.coreDevelopment)

      return {
        id: a._id,
        name: a.name,
        scheme: a.scheme,
        avatarUrl: a.avatarUrl ?? null,
        leaderId: a.leader ?? null,
        leaderName: a.leader ? lookups.userNameById.get(a.leader) ?? null : null,
        leaderAvatarUrl: a.leader ? lookups.userAvatarById.get(a.leader) ?? null : null,
        leaderColorScheme: a.leader ? lookups.userColorSchemeById.get(a.leader) ?? null : null,
        memberCount: members.length,
        members,
        memberNames: members.map(m => `${m.name} ${m.code ?? ''}`).join(' '),
        totalPoints: agg?.total ?? 0,
        totalPointsRank: null,
        avgPoints: agg ? Math.round(agg.total / agg.count) : null,
        avgPointsRank: null,
        avgPointsPerDay: agg ? aggMean(agg.pointsPerDaySum, agg.pointsPerDayCount) : null,
        levelPoints: agg?.level ?? 0,
        damagePoints: agg?.damage ?? 0,
        wealthPoints: agg?.wealthPoints ?? 0,
        ...wealth,
        citizenWealthRank: null,
        companiesWealthRank: null,
        itemsWealthRank: null,
        cashWealthRank: null,
        equipmentWealthRank: null,
        weaponsWealthRank: null,
        createdAt: a.createdAt ?? null,
        development: r?.allianceDevelopment?.value ?? a.currentDevelopment ?? null,
        developmentRank: r?.allianceDevelopment?.rank ?? null,
        developmentTier: toTier(r?.allianceDevelopment?.tier),
        coreDevelopment: a.coreDevelopment ?? null,
        coreDevelopmentRank: null,
        averageDevelopment: a.averageDevelopment ?? null,
        averageDevelopmentRank: null,
        population: r?.alliancePopulation?.value ?? null,
        populationRank: r?.alliancePopulation?.rank ?? null,
        totalDamage: r?.allianceDamages?.value ?? null,
        totalDamageRank: r?.allianceDamages?.rank ?? null,
        weeklyDamage: r?.allianceWeeklyDamages?.value ?? null,
        weeklyDamageRank: r?.allianceWeeklyDamages?.rank ?? null,
        weeklyDamagePerCitizen: r?.allianceWeeklyDamagesPerCitizen?.value ?? null,
        weeklyDamagePerCitizenRank: r?.allianceWeeklyDamagesPerCitizen?.rank ?? null,
      } satisfies AllianceRow
    })
    .sort((x, y) => y.totalPoints - x.totalPoints)

  // The API's own rankings cover current/initial development, damage, and
  // population; the citizen wealth sums and the core/average development
  // fields carry no upstream rank, so rank those across the snapshot like the
  // other group builders do.
  rankAll(rows, [
    'totalPoints',
    'avgPoints',
    'coreDevelopment',
    'averageDevelopment',
    'citizenWealth',
    'companiesWealth',
    'itemsWealth',
    'cashWealth',
    'equipmentWealth',
    'weaponsWealth',
  ])

  return rows
}
