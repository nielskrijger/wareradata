import { InternalLink } from '@/components/links'
import { Paragraph } from '@/components/paragraph'

import { PageShell } from './page-shell'

interface Props {
  /**
   * What wasn't found, as a noun phrase ("user", "military unit").
   */
  entity: string

  /**
   * Where the record can be searched for instead, e.g. `/users`.
   */
  listHref: string
  listLabel: string
}

export function NotFoundPage({ entity, listHref, listLabel }: Props) {
  return (
    <PageShell title={`No such ${entity}`}>
      <Paragraph className="max-w-2xl">
        There is no
        {' '}
        {entity}
        {' '}
        with this id in the current data. Search for it on the
        {' '}
        <InternalLink href={listHref}>{listLabel}</InternalLink>
        {' '}
        page.
      </Paragraph>
    </PageShell>
  )
}
