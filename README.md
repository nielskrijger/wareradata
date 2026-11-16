# WarEra Data

Sortable, filterable stats for the browser game [WarEra](https://app.warera.io).
Live at **<https://wareradata.com>**.

This README is for working on the code. Players will find the site's own
explanation on [/about](https://wareradata.com/about).

## Features

- **Lists** of countries, players, military units, regions, parties, alliances
  and battles. Every table sorts, filters and paginates on the server, with a
  query syntax for advanced filters such as `country:nl level:>30`.
- **Detail pages** for each country, player, MU, party, alliance and battle,
  with hover cards on linked names and a **Refresh** button on players and MUs
  that pulls fresh data straight from the API.
- **Factories and employees**: every player's companies, production, wages and
  employee rosters, with per-employee net value per day.
- **Advise** at `/users/:id/advise`: a to-do list for a player's companies,
  ranked by gold per day. It suggests training cards, tool swaps, item
  switches, hiring and firing staff and managers, and warns when cash will not
  cover a day of wages. `/advise` redirects to the API key owner's list.
- **Search** across all entities, link-preview images at `/og/<kind>/<id>`, and
  a sitemap at `/sitemap.xml`.

### Player points

Each player gets one **Points** score, a flat sum of four parts
([lib/scoring.ts](lib/scoring.ts)):

```
points = level    × 1,000
       + prestige × 2,500
       + damage   ÷ 2,000
       + wealth   × 1
```

A prestige is worth 2.5 levels because its permanent bonus skill level equals
10 skill points, at 4 skill points per level. The breakdown shows level and
prestige together as one part.

## How it works

One Next.js server does both jobs:

1. **Scrapes** the WarEra API in continuous in-process loops and keeps the
   dataset in memory.
2. **Serves** pages and `/api/*` table endpoints from that in-memory copy.

There is no worker, queue or database. On boot the server loads the last
snapshot from disk, starts the loops and begins serving. Each finished cycle
writes a new snapshot and swaps the in-memory copy by reference, so reads never
wait on disk or network.

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 with
shadcn and Base UI, TanStack Table v9, nuqs for URL state, pino for logs, and
the [@wareraprojects/api](https://github.com/WarEraProjects/TRPC) tRPC client.
Packages are managed with npm.

## Getting started

You need Node 26 and a `WARERA_API_KEY` from the game. The key raises the rate
limit to 500 requests per minute and is required for factory and employee data.

```bash
cp .env.example .env.local   # then fill in WARERA_API_KEY
npm install
npm run dev                  # http://localhost:3100
```

The dev server runs the scraper just like production. With no snapshot on
disk, pages show a "no data" state until the first cycle finishes, which takes
a few minutes. To seed the snapshot without starting the server, run
`npm run scrape-main`.

### Environment

| Variable         | Default   | Purpose                                                  |
| ---------------- | --------- | -------------------------------------------------------- |
| `WARERA_API_KEY` | (none)    | API key. Raises the rate limit; needed for factory data. |
| `DATA_DIR`       | `./.data` | Where snapshots and the battle archive are stored.       |
| `LOG_LEVEL`      | `info`    | pino log level.                                          |

### Scripts

| Command                         | What it does                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------------- |
| `npm run dev`                   | Dev server on port 3100 with pretty logs (`dev:raw` for JSON).                            |
| `npm run build` / `npm start`   | Production build and server.                                                              |
| `npm run lint` / `lint:fix`     | ESLint.                                                                                   |
| `npm run scrape-main`           | One main scrape cycle; writes the snapshot and exits.                                     |
| `npm run scrape-factories`      | One all-users factory pass. Needs a main scrape first. `-- --limit=N` scans only N users. |
| `npm run record-battle-history` | Folds the current finished-battle window into the archive, without a main scrape.         |
| `npm run check-advisor`         | Checks the Advise formulas against the game's own estimates. Takes an optional user id.   |

The server refreshes continuously, so production needs no cron.

## API rate limits

The API allows 500 requests per minute per key. The server splits that over
three clients, each with its own budget, so none waits behind another. The
budgets are constants in [lib/warera/api.ts](lib/warera/api.ts):

| Client  | Requests/min | Used for                                                       |
| ------- | -----------: | -------------------------------------------------------------- |
| scrape  |          150 | The main scrape loop.                                          |
| urgent  |          100 | Visitor traffic: Refresh buttons, Advise, factory detail data. |
| factory |          250 | The slow all-users factory scrape.                             |

The client batches up to 50 tRPC calls per HTTP request and retries failures
(429s included). The limit applies per HTTP request, so hydrating ~15k players
takes hundreds of requests rather than thousands. Each loop logs its retry and
rate-limited counts per pass. The urgent client is shared by every visitor, so
keep enough headroom on it when changing the split.

## The scraper

[instrumentation.ts](instrumentation.ts) starts the scraper once per server
through Next's `register` hook. The Node-only code is in
[instrumentation-node.ts](instrumentation-node.ts) so `fs` stays out of the edge
bundle. It loads the snapshot, then starts two loops without awaiting them:

- **Main loop** ([lib/warera/scrape-main.ts](lib/warera/scrape-main.ts)):
  countries and governments, user ids per country, every user plus their
  equipped gear, MUs, regions, parties, alliances, active and recent battles,
  the current tournament and the game config. After each cycle it archives
  newly finished battles and logs memory use, so a leak shows as a rising
  baseline. On error it logs and retries after a short pause.
- **Factory loop** ([lib/warera/scrape-factories.ts](lib/warera/scrape-factories.ts)):
  walks every factory owner's companies and employees on its own budget and
  writes `factories.ndjson`. A pass takes hours, so it saves its progress and a
  restart resumes it rather than starting over.

### Refresh buttons

The Refresh button on player and MU pages calls a Server Action that fetches on
the urgent client, then revalidates the page. An MU refresh re-fetches the
roster and each member's profile and gear; a player refresh re-fetches that
one player. Requests for the same key share one fetch. Refreshes patch the
in-memory snapshot only, and the next full cycle replaces them.

## Storage

Everything lives under `DATA_DIR`, which is a mounted volume in production.

| Path                              | Contents                                                                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `snapshot.json`                   | `countries, governments, strategicBonuses, mus, regions, parties, alliances, battles, tournament, gameConfig, prices, meta` (~5 MB) |
| `users.ndjson`                    | One `User` per line (~84 MB).                                                                                                       |
| `equipment.ndjson`                | One `{ userId, equipment }` per line.                                                                                               |
| `factories.ndjson`                | One `{ userId, rows }` per line, from the factory loop.                                                                             |
| `factories.partial.ndjson`        | The factory pass in progress, renamed over `factories.ndjson` when it completes.                                                    |
| `factories.cursor`                | The last owner id the pass in progress has written.                                                                                 |
| `archive/battles-YYYY-MM-DD.json` | Battles that finished on that UTC day.                                                                                              |
| `archive/seen.json`               | Archived battle ids, for deduplication.                                                                                             |
| `archive/index.json`              | Days available in the archive.                                                                                                      |

Writes go to a temp file and are then renamed, so a reader never sees a
half-written file. The three per-user collections are NDJSON so the row build
can stream them without holding a full array in memory.

The API only returns about two weeks of finished battles, so the archive grows
forward from when the site started and cannot backfill older battles.

## Project layout

| Path               | Contents                                                                           |
| ------------------ | ---------------------------------------------------------------------------------- |
| `app/`             | Routes: list and detail pages, Advise, `/about`, `/api/*`, OG images and sitemaps. |
| `lib/warera/`      | API clients and rate limits (`api.ts`) and the scrape phases.                      |
| `lib/scraper/`     | The in-process loops, publishing and on-demand refreshes.                          |
| `lib/cache/`       | The snapshot on disk and in memory, the NDJSON stores and the battle archive.      |
| `lib/rows/`        | Builds the table rows and lookups from raw entities.                               |
| `lib/factories/`   | Production engine, profit and per-employee stats.                                  |
| `lib/advisor/`     | The Advise model and one file per kind of suggestion in `items/`.                  |
| `lib/scoring.ts`   | The player points formula.                                                         |
| `lib/share-image/` | Link-preview images.                                                               |
| `components/`      | Tables, detail pages, factory and Advise views, and UI primitives.                 |
| `scripts/`         | The one-off commands listed under Scripts.                                         |

Contributor conventions, such as how to write comments, are in
[AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE). If you use this code, a link back to <https://wareradata.com> is
much appreciated.
