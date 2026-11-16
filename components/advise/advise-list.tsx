'use client'

import type { AdvisorResult } from '@/lib/advisor/types'
import Link from 'next/link'

import { Panel } from '@/components/panel'
import { AdviseTable } from './advise-table'
import { AllSet, MoneyCard } from './cards'
import { sum } from './format'
import { RefreshButton } from './refresh-button'
import { splitBySize } from './rows'
import { ShareBar } from './share-bar'

interface Props {
  result: AdvisorResult
  user: { id: string, name: string }
}

/**
 * The advice, most profitable first: a bar of where the gain comes from, then
 * a table of the big wins with the small stuff folded away below.
 */
export function AdviseList({ result, user }: Props) {
  const money = result.items.find(i => i.kind === 'money')
  const { big, small } = splitBySize(result.items.filter(i => i.kind !== 'money'))
  const total = sum(big, 'gainPerDay') + sum(small, 'gainPerDay')

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-brand text-4xl leading-none tracking-wide">Advise</h1>
          <p className="text-muted-foreground text-sm">
            Best next actions for
            {' '}
            <Link href={`/users/${user.id}`} className="text-fire hover:underline">{user.name}</Link>
            , priced at today&apos;s market.
          </p>
        </div>
        <RefreshButton />
      </header>

      {total > 0
        ? <ShareBar big={big} small={small} total={total} />
        : <AllSet />}

      {money && <MoneyCard item={money} />}

      {(big.length > 0 || small.length > 0) && (
        <AdviseTable big={big} small={small} total={total} energy={result.energy} />
      )}

      {result.skipped.length > 0 && (
        <Panel as="aside" className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Checked and skipped</h2>
          <ul className="text-muted-foreground flex flex-col gap-1.5 text-sm">
            {result.skipped.map(s => (
              <li key={s.title}>
                <span className="text-foreground">{s.title}</span>
                {': '}
                {s.why}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}
