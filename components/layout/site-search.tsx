'use client'

import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import type { SearchHit, SearchKind, SearchResponse } from '@/lib/search/types'

import { Dialog } from '@base-ui/react/dialog'
import { Loader2, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'

import { Avatar } from '@/components/avatar'
import { Flag } from '@/components/flag'
import { cn } from '@/lib/utils'

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 120

const GROUP_LABELS: Record<SearchKind, string> = {
  country: 'Countries',
  mu: 'MUs',
  user: 'Users',
}

interface Results {
  query: string
  hits: SearchHit[]
  groups: SearchResponse['groups']
  failed: boolean
}

const noResults: Results = { query: '', hits: [], groups: [], failed: false }

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

function subscribeNever() {
  return () => {
  }
}

/**
 * "⌘" on Apple devices, "Ctrl" elsewhere; null during SSR so the hint only
 * appears once the platform is known.
 */
function useModifierLabel(): string | null {
  return useSyncExternalStore(
    subscribeNever,
    () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl'),
    () => null,
  )
}

/**
 * Nav search that jumps to a country, MU or user. Opens a dialog from the nav
 * button, ⌘K / Ctrl+K, or "/" when no field has focus.
 */
export function SiteSearch() {
  const [open, setOpen] = useState(false)
  const modifier = useModifierLabel()

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(value => !value)
      } else if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isEditable(event.target)) {
        event.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Search users, MUs and countries"
        className={cn(
          'text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex items-center rounded-lg outline-none focus-visible:ring-3',
          // Icon-only until xl, where the wordmark and links leave room for a field.
          'hover:bg-accent/50 h-8 w-8 justify-center',
          'xl:border-input xl:dark:bg-input/30 xl:hover:bg-accent/30 xl:w-56 xl:justify-start xl:gap-2 xl:border xl:px-2.5',
        )}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden text-sm xl:inline">Search…</span>
        {modifier && (
          <kbd
            className="bg-muted text-muted-foreground ml-auto hidden rounded px-1.5 py-0.5 font-sans text-[11px] leading-none xl:inline"
          >
            {modifier}
            {' '}
            K
          </kbd>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            'fixed inset-0 z-50 bg-black/50 duration-100 supports-backdrop-filter:backdrop-blur-xs',
            'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
          )}
        />
        <Dialog.Popup
          className={cn(
            'bg-popover text-popover-foreground ring-foreground/10 fixed z-50 flex flex-col overflow-hidden rounded-xl shadow-lg ring-1 outline-none',
            'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-100',
            // Top-anchored so the on-screen keyboard never covers the input.
            'inset-x-4 top-4 max-h-[calc(100dvh-2rem)]',
            'sm:inset-x-auto sm:top-[12vh] sm:left-1/2 sm:max-h-[min(36rem,76vh)] sm:w-[36rem] sm:-translate-x-1/2',
          )}
        >
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          <SearchPanel onNavigate={() => setOpen(false)} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

interface PanelProps {
  onNavigate: () => void
}

function SearchPanel({ onNavigate }: PanelProps) {
  const router = useRouter()
  const listId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Results>(noResults)
  const [active, setActive] = useState({ query: '', index: 0 })

  const trimmed = query.trim()
  const searchable = trimmed.length >= MIN_QUERY_LENGTH
  const settled = searchable && results.query === trimmed
  // Keep showing the previous hits while the next query loads, so the list
  // doesn't flash empty between keystrokes.
  const shown = searchable ? results : noResults
  const activeIndex = active.query === results.query ? active.index : 0
  const activeHit = shown.hits[activeIndex]

  useEffect(() => {
    if (!searchable) {
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        if (!res.ok) {
          throw new Error(`search failed: ${res.status}`)
        }

        const body = (await res.json()) as SearchResponse
        setResults({ query: trimmed, groups: body.groups, hits: body.groups.flatMap(g => g.hits), failed: false })
      } catch {
        if (!controller.signal.aborted) {
          setResults({ ...noResults, query: trimmed, failed: true })
        }
      }
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [searchable, trimmed])

  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, results])

  function move(delta: number) {
    const count = shown.hits.length
    if (!count) {
      return
    }

    setActive({ query: results.query, index: (activeIndex + delta + count) % count })
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      move(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      move(-1)
    } else if (event.key === 'Enter' && activeHit) {
      event.preventDefault()
      router.push(activeHit.href)
      onNavigate()
    }
  }

  function onHitClick(event: MouseEvent) {
    // Modified clicks open a new tab; keep the dialog for the next pick.
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) {
      onNavigate()
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b px-3">
        {searchable && !settled
          ? <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
          : <Search className="text-muted-foreground h-4 w-4 shrink-0" />}
        <input
          autoFocus
          type="search"
          role="combobox"
          aria-expanded={shown.hits.length > 0}
          aria-controls={listId}
          aria-activedescendant={activeHit ? `${listId}-${activeIndex}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="Search users, MUs, countries…"
          value={query}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          // 16px on phones stops iOS zooming in on focus.
          className="placeholder:text-muted-foreground h-12 min-w-0 flex-1 bg-transparent text-base outline-none sm:text-sm [&::-webkit-search-cancel-button]:hidden"
        />
        <Dialog.Close
          aria-label="Close search"
          className="text-muted-foreground hover:text-foreground hover:bg-accent/50 -mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
        >
          <X className="h-4 w-4" />
        </Dialog.Close>
      </div>

      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="Search results"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {!searchable && <Hint>Type at least two letters of a user, MU or country name.</Hint>}
        {settled && results.failed && <Hint>Search is unavailable right now. Try again in a moment.</Hint>}
        {settled && !results.failed && !results.hits.length && (
          <Hint>
            Nothing matches “
            {trimmed}
            ”.
          </Hint>
        )}
        {shown.groups.map(group => (
          <div key={group.kind} role="group" aria-label={GROUP_LABELS[group.kind]} className="p-1.5">
            <div className="text-muted-foreground px-2 pt-1 pb-1.5 text-xs font-medium">{GROUP_LABELS[group.kind]}</div>
            {group.hits.map((hit) => {
              const index = shown.hits.indexOf(hit)

              return (
                <HitRow
                  key={`${hit.kind}-${hit.id}`}
                  id={`${listId}-${index}`}
                  hit={hit}
                  selected={index === activeIndex}
                  onHover={() => setActive({ query: results.query, index })}
                  onClick={onHitClick}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="text-muted-foreground hidden items-center gap-4 border-t px-3 py-2 text-xs sm:flex">
        <span>
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          {' '}
          to move
        </span>
        <span>
          <Kbd>↵</Kbd>
          {' '}
          to open
        </span>
        <span>
          <Kbd>esc</Kbd>
          {' '}
          to close
        </span>
      </div>
    </>
  )
}

interface HitRowProps {
  id: string
  hit: SearchHit
  selected: boolean
  onHover: () => void
  onClick: (event: MouseEvent) => void
}

function HitRow({ id, hit, selected, onHover, onClick }: HitRowProps) {
  return (
    <Link
      id={id}
      href={hit.href}
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      onMouseMove={selected ? undefined : onHover}
      onClick={onClick}
      className={cn(
        'flex min-h-11 items-center gap-3 rounded-lg px-2 py-1.5',
        selected && 'bg-accent text-accent-foreground',
      )}
    >
      {hit.kind === 'country'
        ? (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center">
              <Flag code={hit.countryCode} className="h-[15px] w-5" />
            </span>
          )
        : <Avatar src={hit.avatarUrl} name={hit.name} size={28} colorScheme={hit.colorScheme} />}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{hit.name}</span>
        {hit.detail && <span className="text-muted-foreground block truncate text-xs">{hit.detail}</span>}
      </span>
      {hit.kind !== 'country' && <Flag code={hit.countryCode} />}
    </Link>
  )
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground px-4 py-8 text-center text-sm">{children}</p>
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      className="bg-muted mr-0.5 inline-flex min-w-5 items-center justify-center rounded px-1 py-0.5 font-sans text-[11px] leading-none"
    >
      {children}
    </kbd>
  )
}
