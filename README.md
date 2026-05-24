# WareraData

Sortable, filterable datatables for the [WarEra](https://app.warera.io)
browser game. Live at **<https://wareradata.com>**.

This README is for operating the codebase, not for end-users of the site
(the `/about` page covers that).

## Local development

Prereqs:

- Node 22+
- Either your own Upstash Redis instance or the prod credentials (read
  access is enough — pages just `GET` snapshot keys)

```bash
cp .env.example .env.local
# fill in WARERA_API_KEY, KV_REST_API_URL, KV_REST_API_TOKEN
npm install
npm run dev
```

If Redis is empty (cold cache), pages render an "no data" state.
Either point at a Redis that already has snapshots, or run a scrape
locally: `npm run scrape`.

## The scraper

[scripts/scrape.ts](scripts/scrape.ts) → [lib/warera/scrape.ts](lib/warera/scrape.ts)
runs five phases sequentially:

1. **Countries** — `country.getAllCountries`, one call (~180 countries).
2. **User IDs per country** — paginate `user.getUsersByCountry` for
   each country, bounded concurrency 10.
3. **Hydrate users** — `user.getUserLite` via tRPC batch, 150 per
   request (~15k users → ~100 batches).
4. **MUs** — cursor loop, 100 per page (~950 MUs).
5. **Regions** — single `region.getRegionsObject` call (~700 regions).

Total: ~250–400 HTTP requests per refresh, ~30 s on a clean run, up
to several minutes if Warera throws 429s.

### Snapshot shape in Redis

Single JSON blob per entity, except users which are sharded by country
(a single 15k-user blob would exceed Upstash's 10 MB cap).

| Key                                           | Shape                                             |
| --------------------------------------------- | ------------------------------------------------- |
| `wareradata:snapshot:countries`               | `Country[]`                                       |
| `wareradata:snapshot:mus`                     | `MU[]`                                            |
| `wareradata:snapshot:regions`                 | `Region[]`                                        |
| `wareradata:snapshot:users:index`             | `string[]` — list of country IDs that have shards |
| `wareradata:snapshot:users:shard:<countryId>` | `UserLite[]`                                      |
| `wareradata:snapshot:meta`                    | `{ scrapedAt, entityCounts, scrapeDurationMs }`   |

Writes are per-key atomic `SET`s — a request landing mid-scrape always
sees a consistent (older) snapshot, never a torn one. The users index
is written last so a partial users update is invisible to readers.

### Triggering a refresh

Automatic: GitHub Actions cron at `0 * * * *`
([refresh-data.yml](.github/workflows/refresh-data.yml)).

Manual: Actions → `refresh-data` → Run workflow. Or locally:
`npm run scrape`.
