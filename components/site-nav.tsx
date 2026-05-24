'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

const links = [
  { href: '/users', label: 'Users' },
  { href: '/countries', label: 'Countries' },
  { href: '/mus', label: 'MUs' },
  { href: '/parties', label: 'Parties' },
  { href: '/regions', label: 'Regions' },
  { href: '/about', label: 'About' },
]

export function SiteNav() {
  const pathname = usePathname()
  return (
    <nav className="bg-background sticky top-0 z-10 border-b">
      <div className="flex items-center gap-3 px-6 py-3 sm:gap-6 sm:px-8 lg:px-12">
        <Link href="/users" className="font-brand flex items-center gap-2 text-[20px] tracking-wide">
          <Logo />
          <span className="hidden sm:inline">WARERA DATA</span>
        </Link>
        <ul className="flex items-center gap-1 text-sm">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'rounded-md px-3 py-1.5 transition-colors',
                    active
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
