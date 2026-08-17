'use client'
import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'

export function LandingProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      value={{ light: 'pm-light', dark: 'pm-dark' }}
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}
