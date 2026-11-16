import { InternalLink } from '@/components/links'
import { Paragraph } from '@/components/paragraph'

import { PageShell } from './page-shell'

interface Props {
  /**
   * What wasn't found, as a noun phrase ("user", "military unit").
   */
  entity?: string

  /**
   * The list page to send the visitor to instead, e.g. `/users`.
   */
  listHref?: string

  /**
   * Label for {@link listHref}, e.g. "Users".
   */
  listLabel?: string
}

/**
 * The "not found" screen for an unknown page or id. With an entity it explains
 * that no such record exists in the current data and links to the list where it
 * can be searched for.
 */
export function NotFoundPage({ entity, listHref, listLabel }: Props) {
  return (
    <PageShell title={entity ? `No such ${entity}` : 'Page not found'}>
      <div className="max-w-2xl space-y-2">
        <Paragraph>
          {entity
            ? `There is no ${entity} with this id in the current data. `
            + 'It may have been deleted, or the link has a typo.'
            : 'There is no page at this address.'}
        </Paragraph>
        <Paragraph>
          {listHref && listLabel
            ? (
                <>
                  Search for it on the
                  {' '}
                  <InternalLink href={listHref}>{listLabel}</InternalLink>
                  {' '}
                  page, or go to
                  {' '}
                  <InternalLink href="/countries">Countries</InternalLink>
                  .
                </>
              )
            : (
                <>
                  Go to
                  {' '}
                  <InternalLink href="/countries">Countries</InternalLink>
                  .
                </>
              )}
        </Paragraph>
      </div>
    </PageShell>
  )
}
