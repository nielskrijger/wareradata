import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'WareraData',
    template: '%s — WareraData',
  },
  description: 'Sortable, filterable datatables of War Era game data.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <div className="flex-1">{children}</div>
        <footer className="text-muted-foreground border-t px-4 py-4 text-center text-xs">
          Data via the{' '}
          <a
            href="https://warerastats.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            warerastats.io
          </a>{' '}
          Gateway.
        </footer>
      </body>
    </html>
  )
}
