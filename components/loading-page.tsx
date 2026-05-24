import { Loader2 } from 'lucide-react'

import { PageTitle } from '@/components/page-title'

interface Props {
  title: string
}

/**
 * Streamed by Next.js as `loading.tsx` while a route's server component
 * awaits its data. The page header matches the real page so the layout
 * doesn't jump when the real content swaps in.
 */
export function LoadingPage({ title }: Props) {
  return (
    <main className="space-y-6 px-6 py-8 sm:px-8 lg:px-12">
      <header>
        <PageTitle>{title}</PageTitle>
      </header>
      <div className="flex h-64 items-center justify-center rounded-md border">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    </main>
  )
}
