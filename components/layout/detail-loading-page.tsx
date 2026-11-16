import { Loader2 } from 'lucide-react'

/**
 * Streamed as a detail page's `loading.tsx` while it awaits its data. Has no
 * heading because the record's name isn't known until the data arrives; its own
 * file also keeps the list page's loading screen from showing on detail pages.
 */
export function DetailLoadingPage() {
  return (
    <main className="px-6 py-8 sm:px-8 lg:px-12">
      <div className="flex h-64 items-center justify-center rounded-md border">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    </main>
  )
}
