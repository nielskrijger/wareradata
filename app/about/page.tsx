import type { Metadata } from 'next'

import { PageTitle } from '@/components/layout/page-title'
import { ExternalLink } from '@/components/links'
import { Paragraph } from '@/components/paragraph'

export const metadata: Metadata = {
  title: 'About',
  description: 'How Warera Data works, where the numbers come from, and how players are scored.',
}

export default function AboutPage() {
  return (
    <main className="space-y-6 px-6 py-8 sm:px-8 lg:px-12">
      <header className="space-y-2">
        <PageTitle>About</PageTitle>
        <Paragraph className="max-w-2xl">
          Warera Data is an unofficial stats site for the game
          {' '}
          <ExternalLink href="https://app.warera.io/">WarEra</ExternalLink>
          .
        </Paragraph>
      </header>

      <section className="max-w-2xl space-y-2">
        <h2 className="font-brand text-xl tracking-wide">How the points score works</h2>
        <Paragraph>
          Each player earns a single
          {' '}
          <strong className="text-foreground">Points</strong>
          {' '}
          score that combines their level, total damage dealt, and accumulated
          wealth. It&apos;s a flat sum: 10× more damage means 10× more points.
        </Paragraph>
        <pre className="bg-muted overflow-x-auto rounded-md p-4 text-xs leading-relaxed">
          <code>
            {`points = level   × 1,000
       + damage  ÷ 2,000
       + wealth  × 1`}
          </code>
        </pre>
        <ul className="text-muted-foreground dark:text-foreground/70 space-y-1 text-sm">
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
        <Paragraph>
          A top-tier player (level 47, 250M damage, 14K wealth) scores
          ~187,000 points; a mid-tier player (level 30, 5M damage, 2K wealth)
          scores ~35,000.
        </Paragraph>
        <Paragraph>
          The scoring formula is deliberately kept simple so it stays easy
          to understand at a glance. The full breakdown is visible in a
          tooltip on every Points value throughout the site.
        </Paragraph>
        <h3 className="pt-2 text-base font-semibold">Caveats and limitations</h3>
        <Paragraph>
          Levels translate into skill points and thus into eco and war
          potential, which is why they&apos;re included in the score. But the
          early levels come quickly: a new account can hit level 12 in a
          week, banking ~12,000 points almost for free, while higher levels
          take much longer. As a result, most of a beginner&apos;s score is
          leveling, while a veteran&apos;s score is mostly damage and wealth
          accumulated over months.
        </Paragraph>
        <Paragraph>
          That said, after the first month the curve flattens out
          considerably. The typical player aged 1–3 months sits around level
          21 at ~520 points/day; at 3–6 months it&apos;s level 28 at ~410
          points/day; at 6–12 months it&apos;s level 37 at ~280 points/day.
          The drop is real, but far less dramatic than the first-week numbers
          might suggest.
        </Paragraph>
        <Paragraph>
          Donated money isn&apos;t exposed on a per-user basis in the WarEra
          API, so it can&apos;t be counted in the score the way damage is. Eco
          players who heavily donate to their country are scored lower than
          their real contribution would suggest.
        </Paragraph>
      </section>

      <section className="max-w-2xl space-y-2">
        <h2 className="font-brand text-xl tracking-wide">Where the data comes from</h2>
        <Paragraph>
          Data is scraped continuously from the
          {' '}
          <ExternalLink href="https://api2.warera.io/docs/">WarEra API</ExternalLink>
          {' '}
          using the community
          {' '}
          <ExternalLink href="https://github.com/WarEraProjects/trpc">tRPC client</ExternalLink>
          {' '}
          by WarEra Projects — a big thank you to them for making it easy to
          work with.
        </Paragraph>
      </section>

      <section className="max-w-2xl space-y-2">
        <h2 className="font-brand text-xl tracking-wide">Open source</h2>
        <Paragraph>
          Warera Data is open source on
          {' '}
          <ExternalLink href="https://github.com/nielskrijger/wareradata">GitHub</ExternalLink>
          . Bug reports and feature requests are all welcome — open an issue
          there, or message
          {' '}
          <ExternalLink href="https://app.warera.io/user/697e645fe58ed7f88da92f20">Flaky</ExternalLink>
          {' '}
          in-game.
        </Paragraph>
      </section>
    </main>
  )
}
