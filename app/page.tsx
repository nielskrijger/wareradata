import { ArrowRight, Globe2 } from 'lucide-react'
import Link from 'next/link'

const tables = [
  {
    href: '/countries',
    title: 'Countries',
    description: 'All Warera countries with damage, wealth, and development rankings.',
    icon: Globe2,
  },
]

export default function Home() {
  return (
    <main className="container mx-auto max-w-4xl space-y-10 px-4 py-16">
      <header className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">WareraData</h1>
        <p className="text-muted-foreground text-lg">
          Scraped data from
          {' '}
          <a
            href="https://warera.io"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            War Era
          </a>
          {' '}
          presented in sortable, filterable tables.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {tables.map(t => (
          <Link
            key={t.href}
            href={t.href}
            className="group bg-card hover:border-foreground/20 hover:bg-accent rounded-lg border p-5 transition-colors"
          >
            <div className="flex items-start justify-between">
              <t.icon className="text-muted-foreground h-5 w-5" />
              <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <h2 className="mt-3 font-semibold">{t.title}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{t.description}</p>
          </Link>
        ))}
      </section>
    </main>
  )
}
