import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

/**
 * Top-of-page heading rendered in the brand font (Bebas Neue).
 * Uses a custom size that sits between Tailwind's text-2xl and text-3xl,
 * tuned to feel intentional next to the all-caps nav mark.
 */
export function PageTitle({ children }: Props) {
  return (
    <h1 className="font-brand text-[28px] leading-none tracking-wide">
      {children}
    </h1>
  )
}
