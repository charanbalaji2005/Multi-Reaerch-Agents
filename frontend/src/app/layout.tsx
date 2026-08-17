import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { LandingProviders } from '@/components/landing/Providers'

export const metadata: Metadata = {
  title: 'ResearchGuard AI — Multi-Agent Scientific Evidence & Citation Verification',
  description:
    'Autonomous AI agents research, extract evidence, verify citations, and stress-test scientific claims before generating an auditable report.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.png', type: 'image/png' },
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: [{ url: '/logo.png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-pm-background text-pm-foreground font-[family-name:var(--font-pm-sans)] antialiased min-h-screen">
        <LandingProviders>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--pm-frame)',
                color: 'var(--pm-foreground)',
                border: '1px solid var(--pm-border)',
                fontFamily: 'var(--font-pm-sans)',
              },
              success: { iconTheme: { primary: '#a8d946', secondary: '#020408' } },
              error: { iconTheme: { primary: '#ff4757', secondary: '#020408' } },
            }}
          />
        </LandingProviders>
      </body>
    </html>
  )
}
