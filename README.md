# WareraData

Sortable, filterable datatables for the [WarEra](https://app.warera.io)
browser game. Live at **<https://wareradata.com>**.

This README is for operating the codebase. It is not a guide for end-users of
the site (the `/about` page covers that).

## How it works

One Next.js server does two jobs at once:

1. **Scrapes** the WarEra API on a continuous in-process loop and keeps the
   full dataset in memory.
2. **Serves** that in-memory dataset as pages of tables.

There is no separate worker, queue, or database. On boot the server loads the
last snapshot from disk, starts the scrape loop, and begins serving. Each
finished scrape cycle persists a new snapshot file and swaps the in-memory copy
that pages read, so reads never block on I/O or on the network.

Stack: Next.js 16 (App Router, React 19), TypeScript, Tailwind CSS 4 with
shadcn / Base UI primitives, TanStack Table, and the
[@wareraprojects/api](https://github.com/WarEraProjects/TRPC) tRPC client.

## Local development

Prereqs:

- Node 22
- A `WARERA_API_KEY` (issued by the game; raises the request-rate tier)

```bash
cp .env.example .env.local
# fill in WARERA_API_KEY (DATA_DIR and the rate limits have defaults)
npm install
npm run dev          # next dev on port 3100
```

The dev server runs the scraper in-process, same as production. On a cold start
with no `DATA_DIR/snapshot.json`, pages render a "no data" state until the first
cycle completes (a few minutes). To seed the file once without running the
server, use `npm run scrape-main`.

### Environment

| Var                 | Default   | Purpose                                        |
| ------------------- | --------- | ---------------------------------------------- |
| `WARERA_API_KEY`    | (none)    | API key; raises the request-rate tier.         |
| `DATA_DIR`          | `./.data` | Where the snapshot and battle archive live.    |
| `SCRAPE_RATE_LIMIT` | `100`     | Requests/min for the continuous scrape client. |
| `URGENT_RATE_LIMIT` | `100`     | Requests/min for the on-demand client.         |

The two rate limits are enforced independently; keep their sum at the API's
authenticated tier.

## The scraper

The scrape loop is started from [instrumentation.ts](instrumentation.ts) on
server boot (Next's `register` hook, which runs once per server instance). The
Node-only logic lives in [instrumentation-node.ts](instrumentation-node.ts) so
its `fs` and scraper imports stay out of the edge bundle: it awaits
`initSnapshot` (load the persisted snapshot into memory) then calls
`startScraper` fire-and-forget, so the loop never blocks the server from
becoming ready.

There are two [@wareraprojects/api](https://www.npmjs.com/package/@wareraprojects/api)
clients, each with its own rate-limit budget so the two never wait on each
other:

- **scrape client** (`SCRAPE_RATE_LIMIT`): the continuous full-scrape loop.
- **urgent client** (`URGENT_RATE_LIMIT`): on-demand, latency-sensitive
  traffic (the per-page Refresh buttons).

The client handles tRPC batching (up to 50 calls per request) and retries, and
enforces the rate limit at the HTTP-request level. So the user phase below is
hundreds of requests, not ~16k, and a full cycle is a few minutes; tune
`SCRAPE_RATE_LIMIT` if needed.

### Cycle phases

A full cycle ([lib/warera/scrape-main.ts](lib/warera/scrape-main.ts)) runs these
phases, then publishes and immediately starts the next:

1. **Countries**: `country.getAllCountries`, one call (~180 countries).
   1b. **Governments**: one call per country (no bulk endpoint), fanned out at
   concurrency 10; unoccupied countries return an all-empty record and are
   dropped.
2. **User IDs per country**: paginate `user.getUsersByCountry`, bounded
   concurrency 10.
3. **Hydrate users**: `user.getUserLite` per id (~15k users), streamed to a
   separate `users.ndjson` file rather than the snapshot.
   3b. **Equipment**: currently-equipped gear, one call per user (batched),
   streamed to a separate `equipment.ndjson` file rather than the snapshot. Many come
   back empty and are kept as-is so readers can tell "captured, none equipped"
   from "not captured".
4. **MUs**: cursor loop, 100 per page (~950 MUs).
5. **Regions**: single `region.getRegionsObject` call (~700 regions).
6. **Parties**: cursor loop, 100 per page (~480 parties).
   6b. **Alliances**: cursor loop (~10 of them, one page in practice).
7. **Battles + tournament**: active plus a recent window of finished battles,
   plus the current tournament's team→MU map.
8. **Game config**: static catalog (item stats, skill cost curves, …), one
   no-arg call; persisted so derived constants can read live data.

After each cycle the loop also folds newly-finished battles into the archive
(see below) and logs a post-GC memory reading, so a slow leak shows up as the
baseline climbing cycle over cycle. On error it logs and retries after a short
pause; the loop never exits.

### Piecemeal refreshes

MU and user detail pages each carry a **Refresh** button
([components/detail/refresh-button.tsx](components/detail/refresh-button.tsx)).
Clicking it calls a Server Action (`requestMuRefresh` / `requestUserRefresh`)
that awaits an on-demand fetch on the **urgent client** (so it returns promptly
regardless of where the scrape loop is), then `revalidatePath`s the page so the
same view re-renders against the freshly updated data:

- **MU**: fetch the live roster (`muMember.getByMu`), then re-hydrate those
  members' lite profiles + equipment.
- **User**: re-fetch that one player's lite profile + equipment.

Refreshes are single-flighted per key (`mu:<id>` / `user:<id>`), so concurrent
requests share one fetch. They are **in-memory only**: they patch the served
snapshot but do not write the file. The whole snapshot is rebuilt so every
aggregate and rank stays globally consistent, and the next full cycle subsumes
the overlay.

## Storage on disk

Everything lives under `DATA_DIR` (the mounted volume in production):

| Path                              | Shape                                                                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `snapshot.json`                   | `{ countries, governments, mus, regions, parties, alliances, battles, tournament, gameConfig, prices, itemBestRegions, meta }` (~5 MB) |
| `users.ndjson`                    | one `User` per line — the raw user array (~84 MB), split out of the snapshot                                                           |
| `equipment.ndjson`                | one `{ userId, equipment }` per line — currently-equipped gear                                                                         |
| `factories.ndjson`                | one `{ userId, rows }` per line — the slow all-users factory scrape's output                                                           |
| `archive/battles-YYYY-MM-DD.json` | `Battle[]` finished that UTC day                                                                                                       |
| `archive/seen.json`               | `string[]` archived battle ids (dedupe)                                                                                                |
| `archive/index.json`              | `string[]` days available                                                                                                              |

Writes are atomic (stream to a temp file, then rename), so a request landing
mid-scrape sees the old or new file, never a torn one. The three big per-user
collections (users, equipment, factories) live in their own NDJSON files: the
build streams each into the derived rows (and a one-user lookup serves the detail
page / hover-card), so a full per-user array never resides in memory alongside
the built rows. That leaves `snapshot.json` itself small. The in-memory snapshot
of built rows is swapped by reference after each cycle, so reads never block on
I/O.

### Battle history archive

The API only serves a rolling ~2-week window of finished battles, so the full
history is built **forward**: after each cycle the loop folds newly-finished
battles into the per-day archive files, deduped by id via `seen.json`. It can't
backfill older battles (they age out of the API).

## Scripts

| Command                         | What it does                                                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                   | Next dev server on port 3100 (scraper runs in-process).                                                                |
| `npm run build` / `npm start`   | Production build and serve.                                                                                            |
| `npm run scrape-main`           | One-off main scrape; writes `DATA_DIR/snapshot.json` and exits. Seeds or rebuilds the file without running the server. |
| `npm run record-battle-history` | Fetch the current finished-battle window and fold it into the archive, idempotently, without a main scrape.            |
| `npm run lint` / `lint:fix`     | ESLint.                                                                                                                |

The in-server loop refreshes continuously; there is no external cron.

## Project layout

| Path           | Contents                                                                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`         | App Router pages: `/countries`, `/users`, `/mus`, `/regions`, `/parties`, `/alliances`, `/battles` (each with detail routes), plus `/about`. `/` redirects to `/countries`. |
| `lib/warera/`  | API client config and the scrape logic (`scrape-main.ts`, `scrape-factories.ts`, `api.ts`).                                                                                 |
| `lib/scraper/` | The in-process loop, publishing, and on-demand refreshes.                                                                                                                   |
| `lib/cache/`   | On-disk snapshot (`file-store.ts`), in-memory snapshot (`memory.ts`), and battle archive (`archive.ts`).                                                                    |
| `lib/rows/`    | Builds the row + lookup shapes the tables render from raw entities.                                                                                                         |
| `components/`  | Table, detail-page, and UI building blocks.                                                                                                                                 |

## License

[MIT](LICENSE). If you use this code in your own project, a link back to
<https://wareradata.com> is much appreciated!
