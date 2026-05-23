import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'

interface Props {
  state: false | 'asc' | 'desc'
}

export function SortIcon({ state }: Props) {
  if (state === 'asc') {
    return <ChevronUp className="h-3.5 w-3.5" />
  }
  if (state === 'desc') {
    return <ChevronDown className="h-3.5 w-3.5" />
  }
  return <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
}
