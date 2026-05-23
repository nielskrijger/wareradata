import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { SiteNav } from '@/components/site-nav'

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

export const metadata: Metadata = {
  metadataBase: new URL('https://wareradata.com'),
  title: {
    default: 'WareraData',
    template: '%s — WareraData',
  },
  description: 'Sortable, filterable datatables of War Era game data.',
  openGraph: {
    type: 'website',
    siteName: 'WareraData',
    url: 'https://wareradata.com',
    title: 'WareraData',
    description: 'Sortable, filterable datatables of War Era game data.',
  },
  twitter: {
    card: 'summary',
    title: 'WareraData',
    description: 'Sortable, filterable datatables of War Era game data.',
  },
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteNav />
        {children}
      </body>
    </html>
  )
}
