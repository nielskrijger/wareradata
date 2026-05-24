import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Bebas_Neue, Geist, Geist_Mono } from 'next/font/google'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { SiteFooter } from '@/components/site-footer'
import { SiteNav } from '@/components/site-nav'
import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'

import 'flag-icons/css/flag-icons.min.css'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const bebasNeue = Bebas_Neue({
  variable: '--font-brand',
  subsets: ['latin'],
  weight: '400',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://wareradata.com'),
  title: {
    default: 'Warera Data',
    template: '%s — Warera Data',
  },
  description: 'Sortable, filterable datatables of War Era game data.',
  openGraph: {
    type: 'website',
    siteName: 'Warera Data',
    url: 'https://wareradata.com',
    title: 'Warera Data',
    description: 'Sortable, filterable datatables of War Era game data.',
  },
  twitter: {
    card: 'summary',
    title: 'Warera Data',
    description: 'Sortable, filterable datatables of War Era game data.',
  },
  alternates: {
    canonical: '/',
  },
}

interface Props {
  children: ReactNode
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <NuqsAdapter>
            <TooltipProvider>
              <SiteNav />
              {children}
              <SiteFooter />
            </TooltipProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  )
}
