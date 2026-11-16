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
import { SiteSearch } from './site-search'
import { ThemeToggle } from './theme-toggle'

const links = [
  { href: '/countries', label: 'Countries' },
  { href: '/alliances', label: 'Alliances' },
  { href: '/mus', label: 'MUs' },
  { href: '/users', label: 'Users' },
  { href: '/parties', label: 'Parties' },
  { href: '/regions', label: 'Regions' },
  { href: '/battles', label: 'Battles' },
  { href: '/about', label: 'About' },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * The nav's silhouette for the layout's Suspense fallback: SiteNav reads the
 * pathname, so it can't render in the static shell.
 */
export function SiteNavFallback() {
  return <div className="bg-background sticky top-0 z-30 h-[57px] border-b" />
}

export function SiteNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-background sticky top-0 z-30 border-b">
      {/* Logo at the screen's left edge, menu in the content column. The logo's track
          never shrinks below the logo, so on narrower screens it pushes the menu right. */}
      <div className="grid grid-cols-[minmax(max-content,1fr)_minmax(0,var(--container-site))_1fr] items-center py-3">
        <Link
          href="/countries"
          className="font-brand flex items-center gap-2 pr-3 pl-6 text-[20px] tracking-wide sm:pl-8 lg:pl-12"
        >
          <Logo />
          {/* Drop the wordmark below lg so the eight inline links keep their
              room down to the md breakpoint; the logo mark alone still brands. */}
          <span className="logo-fire-text hidden lg:inline">WARERA DATA</span>
        </Link>

        {/* Inline links on wide screens. With the wordmark hidden below lg, the
            eight items + toggle fit down to md; below that they collapse into
            the hamburger menu on the right. */}
        <div className="flex min-w-0 items-center gap-3 px-6 sm:gap-6 sm:px-8 lg:px-12">
          {/* Pull the list left by the pill padding so "Countries" lines up with the page text. */}
          <ul className="hidden items-center gap-1 text-sm md:flex -ml-2.5 lg:-ml-3">
            {links.map((link) => {
              const active = isActive(pathname, link.href)

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'rounded-md px-2.5 py-1.5 transition-colors lg:px-3',
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
            <SiteSearch />
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
      </div>
    </nav>
  )
}
