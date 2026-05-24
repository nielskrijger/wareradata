'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // `resolvedTheme` is only known on the client; flip `mounted` once after
  // hydration so the icon reflects the real theme without a mismatch. The
  // single intentional re-render is the standard next-themes pattern.
  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => setMounted(true), [])

  // Dark is the default (defaultTheme="dark" in the provider); this toggle
  // flips between the two concrete themes and persists the choice.
  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={isDark ? 'Dark theme' : 'Light theme'}
    >
      {isDark ? <Moon /> : <Sun />}
    </Button>
  )
}
