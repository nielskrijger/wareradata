'use client'

import { Info } from 'lucide-react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface SearchExample {
  q: string
  desc: string
}

interface Props {
  /**
   * Sentence shown above the example list. Should mention what plain text
   * matches against ("Type plain text to search across name, country…").
   */
  introText: string
  /**
   * Cheatsheet rows. Caller controls the full list — order, content, and
   * any page-specific field names.
   */
  examples: SearchExample[]
  /**
   * Trailing comma-separated list of available field names.
   */
  fieldsList: string
}

/**
 * Info icon next to a DataTable search input that, when clicked, opens a
 * popover with examples of the advanced (liqe-based) filter syntax.
 *
 * Each consumer passes the page-specific intro, example rows, and fields
 * list — this component just owns the icon, popover chrome, and layout.
 */
export function AdvancedSearchHint({ introText, examples, fieldsList }: Props) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Advanced filter syntax"
        className="text-muted-foreground hover:text-foreground inline-flex h-8 w-8 items-center justify-center rounded-md"
      >
        <Info className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96">
        <p className="mb-2 font-medium">Advanced filtering</p>
        <p className="text-muted-foreground mb-3">{introText}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 font-mono text-xs">
          {examples.map(ex => (
            <ExampleRow key={ex.q} q={ex.q} desc={ex.desc} />
          ))}
        </dl>
        <p className="text-muted-foreground mt-3 text-xs">
          Fields:
          {' '}
          {fieldsList}
        </p>
      </PopoverContent>
    </Popover>
  )
}

function ExampleRow({ q, desc }: SearchExample) {
  return (
    <>
      <dt className="text-foreground">{q}</dt>
      <dd className="text-muted-foreground">{desc}</dd>
    </>
  )
}
