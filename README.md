# WareraData

Sortable, filterable datatables for the [WarEra](https://app.warera.io)
browser game. Live at **<https://wareradata.com>**.

This README is for operating the codebase, not for end-users of the site
(the `/about` page covers that).

## Local development

Prereqs:

- Node 22+
- A `WARERA_API_KEY` (raises the request-rate tier)

```bash
cp .env.example .env.local
# fill in WARERA_API_KEY (DATA_DIR and SCRAPE_RATE_LIMIT have defaults)
npm install
npm run dev
```

The server runs the scraper in-process: on boot it loads the snapshot
file (if present) and starts a continuous scrape loop. On a cold start
with no `DATA_DIR/snapshot.json`, pages render a "no data" state until
the first cycle completes (a few minutes). To seed the file once without
running the server, use `npm run scrape`.

## The scraper

The scraper runs **in-process** as a continuous loop, started from
[instrumentation.ts](instrumentation.ts) on server boot. There are two
[@wareraprojects/api](https://www.npmjs.com/package/@wareraprojects/api)
clients, each with its own independent rate-limit budget so the two never
wait on each other:

- **scrape client** (`SCRAPE_RATE_LIMIT`, default 100/min): the continuous
  full-scrape loop.
- **urgent client** (`URGENT_RATE_LIMIT`, default 100/min): on-demand,
  latency-sensitive traffic (piecemeal MU refreshes, live battles).

The client handles tRPC batching (up to 50 calls/request) and retries, and
enforces the rate limit at the HTTP-request level. A full cycle
([lib/warera/scrape.ts](lib/warera/scrape.ts)) runs these phases, then
publishes and immediately starts the next:

1. **Countries** — `country.getAllCountries`, one call (~180 countries).
2. **User IDs per country** — paginate `user.getUsersByCountry`, bounded
   concurrency 10.
3. **Hydrate users** — `user.getUserLite` per id (~15k users).
4. **MUs** — cursor loop, 100 per page (~950 MUs).
5. **Regions** — single `region.getRegionsObject` call (~700 regions).
6. **Parties** — cursor loop, 100 per page (~480 parties).
7. **Battles + tournament** — active + recent finished battles, plus the
   current tournament's team→MU map.

Thanks to batching the user phase is ~hundreds of requests, not ~16k, so a
full cycle is a few minutes; tune `SCRAPE_RATE_LIMIT` if needed.

### Piecemeal refreshes

Viewing an MU detail page fires `enqueueMuRefresh` (fire-and-forget, deduped
per MU). It runs on the urgent client, so it returns promptly regardless of
where the scrape loop is: it fetches that MU's live roster
(`muMember.getByMu`), re-hydrates those users, and republishes. The current
view shows possibly-stale data; the next view is fresh.

### Storage shape on disk

Everything lives under `DATA_DIR` (the mounted volume in production):

| Path                              | Shape                                                                    |
| --------------------------------- | ------------------------------------------------------------------------ |
| `snapshot.json`                   | `{ users, countries, mus, regions, parties, battles, tournament, meta }` |
| `archive/battles-YYYY-MM-DD.json` | `Battle[]` finished that UTC day                                         |
| `archive/seen.json`               | `string[]` archived battle ids (dedupe)                                  |
| `archive/index.json`              | `string[]` days available                                                |

Writes are atomic (temp file + rename), so a request landing mid-scrape
sees the old or new file, never a torn one. The in-memory row snapshot
is swapped by reference after each cycle, so reads never block on I/O.

### Battle history archive

The API only serves a rolling ~2-week window of finished battles, so the
full history is built **forward**: after each cycle the worker folds
newly-finished battles into the per-day archive files, deduped by id. It
can't backfill older battles (they age out of the API).

### Triggering a refresh

The in-server loop refreshes continuously; there is no external cron. To
seed or rebuild the snapshot file from a one-off run, use `npm run scrape`
(it writes `DATA_DIR/snapshot.json` and exits).

## License

[MIT](LICENSE). If you use this code in your own project, a link back
to <https://wareradata.com> is much appreciated!
