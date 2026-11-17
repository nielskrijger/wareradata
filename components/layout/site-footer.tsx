import { Suspense } from 'react'

import { GroupCell } from '@/components/cells/group-cell'
import { UserNameCell } from '@/components/cells/user-name-cell'
import { ExternalLink } from '@/components/links'

import { cn } from '@/lib/utils'

import { DataFreshness } from './data-freshness'
import { PAGE_GUTTER } from './page-gutter'

const HUZAREN_ID = '6980b01819decffdc7848ef9'
const HUZAREN_AVATAR = 'https://media.warera.io/avatars/mu/mu-6980b01819decffdc7848ef9-1770821860524-yd1m6m7w.png'

const FLAKY_ID = '697e645fe58ed7f88da92f20'
const FLAKY_AVATAR = 'https://media.warera.io/avatars/697e645fe58ed7f88da92f20-1775289241484-4tcvm1jk.jpg'

export function SiteFooter() {
  return (
    <footer className={cn(PAGE_GUTTER, 'mt-auto flex flex-col items-center gap-1 border-t py-4 text-center')}>
      <div className="text-foreground flex flex-wrap items-center justify-center gap-x-1.5 text-xs">
        <span>Brought to you by</span>
        <GroupCell kind="mu" name="Regiment Huzaren" id={HUZAREN_ID} avatarUrl={HUZAREN_AVATAR} bold />
        <span>and</span>
        <UserNameCell userId={FLAKY_ID} name="Flaky" avatarUrl={FLAKY_AVATAR} colorScheme="red" />
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-1.5 text-[11px]">
        <Suspense fallback={<span>Updated hourly</span>}>
          <DataFreshness />
        </Suspense>
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-x-1">
          Keep the hamster fed, subscribe on
          <ExternalLink href="https://app.warera.io">WarEra</ExternalLink>
        </span>
      </div>
    </footer>
  )
}
