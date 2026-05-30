import type { ReactNode } from 'react'

import { PageTitle } from './page-title'

interface Props {
  title: ReactNode
  subtitle?: ReactNode
  children?: ReactNode
}

export function PageShell({ title, subtitle, children }: Props) {
  return (
    <main className="space-y-6 px-6 py-8 sm:px-8 lg:px-12">
      <header>
        <PageTitle>{title}</PageTitle>
        {subtitle
          ? (
              <p className="text-muted-foreground text-sm">{subtitle}</p>
            )
          : null}
      </header>
      {children}
    </main>
  )
}
