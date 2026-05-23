import type { Metadata } from 'next'

import type { CountryRow } from './columns'
import { DataTable } from '@/components/data-table/data-table'

import { getAllCountries, getRanking } from '@/lib/warera/endpoints'
import { countryColumns } from './columns'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Countries — WareraData',
  description: 'All Warera countries ranked by weekly and all-time damage.',
}

export default async function CountriesPage() {
  const [countries, damageRanking] = await Promise.all([
    getAllCountries(),
    getRanking('countryDamages'),
  ])

  const damageByCountry = new Map(damageRanking.items.map(i => [i.country ?? '', i]))

  const rows: CountryRow[] = countries.map((c) => {
    const dmg = damageByCountry.get(c._id)
    return {
      id: c._id,
      name: c.name,
      code: c.code,
      damageRank: dmg?.rank ?? c.rankings?.countryDamages?.rank ?? null,
      damageValue: dmg?.value ?? c.rankings?.countryDamages?.value ?? null,
      damageTier: dmg?.tier ?? c.rankings?.countryDamages?.tier ?? null,
      wealthRank: c.rankings?.countryWealth?.rank ?? null,
      development: c.development ?? null,
      activePopulation: c.rankings?.countryActivePopulation?.value ?? null,
    }
  })

  rows.sort((a, b) => {
    if (a.damageRank === null)
      return 1
    if (b.damageRank === null)
      return -1
    return a.damageRank - b.damageRank
  })

  return (
    <main className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Countries</h1>
        <p className="text-muted-foreground text-sm">
          All {rows.length} countries in Warera, ranked by all-time damage.
        </p>
      </header>
      <DataTable columns={countryColumns} data={rows} searchPlaceholder="Filter by name or code…" />
    </main>
  )
}
