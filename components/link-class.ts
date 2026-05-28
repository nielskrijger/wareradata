/**
 * The shared "this is a link" treatment: blue text in both themes, deeper
 * blue + underline on hover. Used by both `InternalLink` (next/link wrapper)
 * and `ExternalLink` (text-mode external `<a>`) so every link in the app
 * reads the same at rest and on hover.
 *
 * Lives in its own file (not `links.tsx`) so React Fast Refresh keeps
 * working on the component file — Fast Refresh requires component files to
 * export only components.
 */
export const linkClass
  = 'text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-300 dark:hover:text-blue-200'
