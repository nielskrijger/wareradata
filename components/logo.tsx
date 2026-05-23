import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

/**
 * The Warera Data logo: tank silhouette with a chart line running off the
 * barrel ("war + data" mark). Inherits `currentColor`.
 */
export function Logo({ className }: Props) {
  return (
    <svg
      viewBox="3 7 26 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-6 w-auto', className)}
      aria-hidden="true"
    >
      <path d="M3 17 L29 17 L27 14 L5 14 Z" fill="currentColor" />
      <circle cx="7" cy="19" r="2.5" fill="currentColor" />
      <circle cx="13" cy="19" r="2.5" fill="currentColor" />
      <circle cx="19" cy="19" r="2.5" fill="currentColor" />
      <circle cx="25" cy="19" r="2.5" fill="currentColor" />
      <rect x="10" y="9" width="10" height="5" rx="1" fill="currentColor" />
      <path
        d="M20 11.5 L24 11.5 L26 8.5 L29 9.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="29" cy="9.5" r="1.1" fill="currentColor" />
    </svg>
  )
}
