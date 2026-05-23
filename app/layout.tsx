import type { Metadata } from 'next'
import { Bebas_Neue, Geist, Geist_Mono } from 'next/font/google'

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
  children: React.ReactNode
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteNav />
        {children}
      </body>
    </html>
  )
}
