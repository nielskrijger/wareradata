import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { PageTitle } from './page-title'

interface Props {
  title: ReactNode
  subtitle?: ReactNode
  children?: ReactNode
  className?: string
}

export function PageShell({ title, subtitle, children, className }: Props) {
  return (
    <main className={cn('space-y-6 px-6 py-8 sm:px-8 lg:px-12', className)}>
      <header>
        <PageTitle>{title}</PageTitle>
        {subtitle ? (
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </main>
  )
}
