import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Bebas_Neue, Geist, Geist_Mono } from 'next/font/google'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Suspense } from 'react'

import { SiteFooter } from '@/components/layout/site-footer'
import { SiteNav, SiteNavFallback } from '@/components/layout/site-nav'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SHARE_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/metadata'

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [SHARE_IMAGE],
  },
}

interface Props {
  children: ReactNode
}

export default function RootLayout({ children }: Props) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <NuqsAdapter>
            <TooltipProvider>
              <Suspense fallback={<SiteNavFallback />}>
                <SiteNav />
              </Suspense>
              {/* One width cap for every page, so wide screens keep a readable column. */}
              <div className="mx-auto w-full max-w-site flex-1">{children}</div>
              <SiteFooter />
            </TooltipProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  )
}
