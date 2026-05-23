import type { ReactNode } from 'react'

import { ExternalLink } from 'lucide-react'

type Target = 'user' | 'country' | 'mu'

interface Props {
  kind: Target
  id: string | null | undefined
  children: ReactNode
}

/**
 * Renders text as a link to the corresponding entity on app.warera.io.
 * When `id` is missing the children are rendered plain.
 */
export function WareraLink({ kind, id, children }: Props) {
  if (!id) {
    return <>{children}</>
  }

  return (
    <a
      href={`https://app.warera.io/${kind}/${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-foreground inline-flex items-center gap-1 hover:underline"
    >
      {children}
      <ExternalLink className="text-muted-foreground h-3 w-3" />
    </a>
  )
}
