'use client'

import { Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { ThemeToggle } from './theme-toggle'

const links = [
  { href: '/users', label: 'Users' },
  { href: '/countries', label: 'Countries' },
  { href: '/mus', label: 'MUs' },
  { href: '/parties', label: 'Parties' },
  { href: '/regions', label: 'Regions' },
  { href: '/battles', label: 'Battles' },
  { href: '/about', label: 'About' },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Silhouette of the nav at the same height as the live version, for use as
 * the Suspense fallback at the layout level — SiteNav reads usePathname() and
 * is dynamic per request, so under cacheComponents it can't render in the
 * static shell.
 */
export function SiteNavFallback() {
  return <div className="bg-background sticky top-0 z-30 h-[57px] border-b" />
}

export function SiteNav() {
  const pathname = usePathname()
  return (
    <nav className="bg-background sticky top-0 z-30 border-b">
      <div className="flex items-center gap-3 px-6 py-3 sm:gap-6 sm:px-8 lg:px-12">
        <Link href="/users" className="font-brand flex items-center gap-2 text-[20px] tracking-wide">
          <Logo />
          {/* Drop the wordmark below lg so the seven inline links keep their
              room down to the md breakpoint; the logo mark alone still brands. */}
          <span className="logo-fire-text hidden lg:inline">WARERA DATA</span>
        </Link>

        {/* Inline links on wide screens. With the wordmark hidden below lg, the
            seven items + toggle fit down to md; below that they collapse into
            the hamburger menu on the right. */}
        <ul className="hidden items-center gap-1 text-sm md:flex">
          {links.map((link) => {
            const active = isActive(pathname, link.href)
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'rounded-md px-3 py-1.5 transition-colors',
                    active
                      ? 'bg-fire/12 text-fire ring-fire/25 ring-1'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open menu"
              className="text-muted-foreground hover:text-foreground hover:bg-accent/50 inline-flex h-9 w-9 items-center justify-center rounded-md md:hidden"
            >
              <Menu className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              {links.map((link) => {
                const active = isActive(pathname, link.href)
                return (
                  <DropdownMenuItem
                    key={link.href}
                    render={<Link href={link.href} />}
                    className={cn(active && 'text-fire')}
                  >
                    {link.label}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
