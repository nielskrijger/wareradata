import type { Metadata } from 'next'

import { ExternalLink } from '@/components/external-link'
import { PageTitle } from '@/components/page-title'

export const metadata: Metadata = {
  title: 'About',
  description: 'How Warera Data works, where the numbers come from, and how players are scored.',
}

export default function AboutPage() {
  return (
    <main className="space-y-6 px-6 py-8 sm:px-8 lg:px-12">
      <header className="space-y-2">
        <PageTitle>About</PageTitle>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Warera Data is an unofficial stats site for the browser game
          {' '}
          <ExternalLink href="https://app.warera.io/">WarEra</ExternalLink>
          . Every row you see is scraped from the public game API, kept in a
          fast in-memory cache, and refreshed on a schedule.
        </p>
      </header>

      <section className="max-w-2xl space-y-2">
        <h2 className="font-brand text-xl tracking-wide">How the points score works</h2>
        <p className="text-muted-foreground text-sm">
          Each player earns a single
          {' '}
          <strong className="text-foreground">Points</strong>
          {' '}
          score that combines their level, total damage dealt, and accumulated
          wealth. It&apos;s a flat sum: 10× more damage means 10× more points.
        </p>
        <pre className="bg-muted overflow-x-auto rounded-md p-4 text-xs leading-relaxed">
          <code>
            {`points = level   × 1,000
       + damage  ÷ 2,000
       + wealth  × 1`}
          </code>
        </pre>
        <ul className="text-muted-foreground space-y-1 text-sm">
          <li>
            <strong className="text-foreground">Level</strong>
            : 1,000 points per level. A level-50 player gets 50,000 points
            from leveling alone.
          </li>
          <li>
            <strong className="text-foreground">Damage</strong>
            : 1 point per 2,000 damage dealt. A player with 200M damage gets
            100,000 points.
          </li>
          <li>
            <strong className="text-foreground">Wealth</strong>
            : 1 point per unit of total assets (gold + equipment + weapons +
            items, as valued by the game). A player with 100K wealth gets
            100,000 points.
          </li>
        </ul>
        <p className="text-muted-foreground text-sm">
          A top-tier player (level 47, 250M damage, 14K wealth) scores
          ~187,000 points; a mid-tier player (level 30, 5M damage, 2K wealth)
          scores ~35,000.
        </p>
      </section>

      <section className="max-w-2xl space-y-2">
        <h2 className="font-brand text-xl tracking-wide">Where the data comes from</h2>
        <p className="text-muted-foreground text-sm">
          Data is refreshed from the
          {' '}
          <ExternalLink href="https://api2.warera.io/docs/">WarEra API</ExternalLink>
          {' '}
          every hour.
        </p>
      </section>

      <section className="max-w-2xl space-y-2">
        <h2 className="font-brand text-xl tracking-wide">Open source</h2>
        <p className="text-muted-foreground text-sm">
          Warera Data is open source. Bug reports, sorting suggestions, or a
          better points formula are all welcome — message
          {' '}
          <ExternalLink href="https://app.warera.io/user/697e645fe58ed7f88da92f20">Flaky</ExternalLink>
          {' '}
          in-game.
        </p>
      </section>
    </main>
  )
}
