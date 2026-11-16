'use client'

import type { KeyboardEvent } from 'react'
import type { SearchHit } from '@/lib/search'

import { Dialog } from '@base-ui/react/dialog'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Avatar } from '@/components/avatar'
import { Flag } from '@/components/flag'
import { cn } from '@/lib/utils'

const LABELS = { country: 'Countries', mu: 'MUs', user: 'Users' }

/**
 * Nav search that jumps to a country, MU or user. Opens from the nav button
 * or ⌘K / Ctrl+K.
 */
export function SiteSearch() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(value => !value)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* Icon-only until xl, where the nav has room for a field. */}
      <Dialog.Trigger
        aria-label="Search"
        className={cn(
          'text-muted-foreground hover:text-foreground hover:bg-accent/50 inline-flex h-8 w-8 items-center',
          'justify-center gap-2 rounded-lg text-sm xl:w-56 xl:justify-start xl:px-2.5',
          // Matches SearchInput so the nav field and table filters look alike.
          'xl:border-input xl:dark:bg-input/50 xl:border',
        )}
      >
        <Search className="h-4 w-4" />
        <span className="hidden xl:inline">Search…</span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />
        {/* Top-anchored so the phone keyboard never covers the input. */}
        <Dialog.Popup
          className={cn(
            'bg-popover text-popover-foreground fixed inset-x-4 top-4 z-50 flex max-h-[calc(100dvh-2rem)] flex-col',
            'ring-foreground/10 overflow-hidden rounded-xl shadow-lg ring-1 outline-none',
            'sm:inset-x-auto sm:top-[12vh] sm:left-1/2 sm:max-h-[70vh] sm:w-xl sm:-translate-x-1/2',
          )}
        >
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          <SearchPanel onNavigate={() => setOpen(false)} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function SearchPanel({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[] | null>(null)
  const [active, setActive] = useState(0)
  const trimmed = query.trim()
  const searchable = trimmed.length >= 2

  useEffect(() => {
    if (!searchable) {
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        setHits(await res.json())
        setActive(0)
      } catch {
      }
    }, 120)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [searchable, trimmed])

  const shown = searchable ? (hits ?? []) : []

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive(i => (i + step + shown.length) % Math.max(shown.length, 1))
    } else if (event.key === 'Enter' && shown[active]) {
      router.push(shown[active].href)
      onNavigate()
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b px-3">
        <Search className="text-muted-foreground h-4 w-4 shrink-0" />
        {/* 16px on phones stops iOS zooming in on focus. */}
        <input
          autoFocus
          placeholder="Search users, MUs, countries…"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          className="placeholder:text-muted-foreground h-12 min-w-0 flex-1 bg-transparent text-base outline-none sm:text-sm"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {!searchable && <Hint>Type at least two letters of a name.</Hint>}
        {searchable && hits?.length === 0 && <Hint>Nothing matches.</Hint>}
        {shown.map((hit, i) => (
          <div key={`${hit.kind}-${hit.id}`}>
            {hit.kind !== shown[i - 1]?.kind && (
              <div className="text-muted-foreground px-2 pt-2 pb-1 text-xs font-medium">{LABELS[hit.kind]}</div>
            )}
            <Link
              href={hit.href}
              onClick={onNavigate}
              onMouseMove={() => setActive(i)}
              className={cn('flex min-h-11 items-center gap-3 rounded-lg px-2 py-1.5', i === active && 'bg-accent')}
            >
              {hit.kind === 'country'
                ? <Flag code={hit.countryCode} className="mx-1 h-[15px] w-5" />
                : <Avatar src={hit.avatarUrl} name={hit.name} size={28} colorScheme={hit.colorScheme} />}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{hit.name}</span>
                <span className="text-muted-foreground block truncate text-xs">{hit.detail}</span>
              </span>
              {hit.kind !== 'country' && <Flag code={hit.countryCode} />}
            </Link>
          </div>
        ))}
      </div>
    </>
  )
}

function Hint({ children }: { children: string }) {
  return <p className="text-muted-foreground px-4 py-8 text-center text-sm">{children}</p>
}
