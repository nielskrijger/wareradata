import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { PageMain } from './page-main'
import { PageTitle } from './page-title'

interface Props {
  title: ReactNode
  subtitle?: ReactNode
  children?: ReactNode
  className?: string
}

export function PageShell({ title, subtitle, children, className }: Props) {
  return (
    <PageMain className={cn('space-y-6', className)}>
      <header>
        <PageTitle>{title}</PageTitle>
        {subtitle ? (
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </PageMain>
  )
}
