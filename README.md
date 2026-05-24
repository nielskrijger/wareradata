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
# fill in WARERA_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
npm install
npm run dev
```

If Redis is empty (cold cache), pages render an "no data" state.
Either point at a Redis that already has snapshots, or run a scrape
locally: `npm run scrape`.

## The scraper

[scripts/scrape.ts](scripts/scrape.ts) → [lib/warera/scrape.ts](lib/warera/scrape.ts)
runs six phases sequentially via the
[@wareraprojects/api](https://www.npmjs.com/package/@wareraprojects/api)
tRPC client, which handles batching, rate limiting, and retries:

1. **Countries** — `country.getAllCountries`, one call (~180 countries).
2. **User IDs per country** — paginate `user.getUsersByCountry` for
   each country, bounded concurrency 10.
3. **Hydrate users** — `user.getUserLite` per id; the client auto-batches
   concurrent calls (cap 50/request), so ~15k users → ~330 batches.
4. **MUs** — cursor loop, 100 per page (~950 MUs).
5. **Regions** — single `region.getRegionsObject` call (~700 regions).
6. **Parties** — cursor loop, 100 per page (~480 parties).

A clean run takes a few minutes; much longer if Warera throttles (429s),
which the client backs off and retries automatically.

### Snapshot shape in Redis

Single JSON blob per entity, except users which are sharded into 32
fixed buckets (a single 15k-user blob would exceed Upstash's 10 MB cap).
Users are bucketed by a hash of their `_id` (last two hex chars mod 32),
so the distribution stays uniform regardless of country sizes.

| Key                                       | Shape                                           |
| ----------------------------------------- | ----------------------------------------------- |
| `wareradata:snapshot:countries`           | `Country[]`                                     |
| `wareradata:snapshot:mus`                 | `MU[]`                                          |
| `wareradata:snapshot:parties`             | `Party[]`                                       |
| `wareradata:snapshot:regions`             | `Region[]`                                      |
| `wareradata:snapshot:users:bucket:<0–31>` | `UserLite[]`                                    |
| `wareradata:snapshot:meta`                | `{ scrapedAt, entityCounts, scrapeDurationMs }` |

Writes are per-key atomic `SET`s — a request landing mid-scrape always
sees a consistent (older) snapshot, never a torn one. The bucket count
is a fixed constant, so readers don't need an index — they just read
buckets 0–31.

### Triggering a refresh

Automatic: GitHub Actions cron at `0 * * * *`
([refresh-data.yml](.github/workflows/refresh-data.yml)).

Manual: Actions → `refresh-data` → Run workflow. Or locally:
`npm run scrape`.

## License

[MIT](LICENSE). If you use this code in your own project, a link back
to <https://wareradata.com> is much appreciated!
