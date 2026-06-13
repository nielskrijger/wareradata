import type { RegionRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { Region } from '@/lib/warera/api'

export function buildRegionRows(regions: Region[], lookups: Lookups): RegionRow[] {
  return regions
    .map((r) => {
      const country = r.country ? lookups.countryById.get(r.country) : undefined
      const core = r.initialCountry ? lookups.countryById.get(r.initialCountry) : undefined

      return {
        baseDevelopment: r.baseDevelopment ?? null,
        biome: r.biome ?? null,
        climate: r.climate ?? null,
        code: r.code,
        coreCountryCode: core?.code ?? null,
        coreCountryId: r.initialCountry ?? null,
        coreCountryName: core?.name ?? null,
        countryCode: country?.code ?? null,
        countryId: r.country ?? null,
        countryName: country?.name ?? null,
        development: r.development ?? null,
        id: r._id,
        isCapital: r.isCapital ?? false,
        isLinkedToCapital: r.isLinkedToCapital ?? false,
        mainCity: r.mainCity ?? null,
        name: r.name,
        neighborCount: r.neighbors?.length ?? 0,
        strategicResource: r.strategicResource ?? null,
      }
    })
    .sort((a, b) => (b.development ?? 0) - (a.development ?? 0))
}
