'use client'
import { Header } from '@/components/landing/Header'
import { Hero } from '@/components/landing/Hero'
import { BlurInHeadline } from '@/components/landing/BlurInHeadline'
import { FeaturesBento } from '@/components/landing/FeaturesBento'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { WorkspacePreview } from '@/components/landing/WorkspacePreview'
import { FAQ } from '@/components/landing/FAQ'
import { Footer } from '@/components/landing/Footer'
import { LandingProviders } from '@/components/landing/Providers'
import { ThemeSwitch } from '@/components/landing/ThemeSwitch'
import { SkipToContent } from '@/components/landing/SkipToContent'

export default function LandingPage() {
  return (
    <LandingProviders>
      <div className="pm-landing min-h-screen bg-pm-background font-[family-name:var(--font-pm-sans)] text-pm-foreground antialiased relative">
        {/* Fixed frame chrome, ported from Palletman */}
        <div className="pm-site-frame pm-site-frame--top" aria-hidden="true" />
        <div className="pm-site-frame pm-site-frame--bottom" aria-hidden="true" />
        <div className="pm-site-frame pm-site-frame--left" aria-hidden="true" />
        <div className="pm-site-frame pm-site-frame--right" aria-hidden="true" />

        <svg className="pm-site-corner pm-site-corner--top-left" width="50" height="50" viewBox="0 0 50 50" fill="none" aria-hidden="true">
          <path d="M5.50871e-06 0C-0.00788227 37.3001 8.99616 50.0116 50 50H5.50871e-06V0Z" fill="currentColor" />
        </svg>
        <svg className="pm-site-corner pm-site-corner--top-right" width="50" height="50" viewBox="0 0 50 50" fill="none" aria-hidden="true">
          <path d="M5.50871e-06 0C-0.00788227 37.3001 8.99616 50.0116 50 50H5.50871e-06V0Z" fill="currentColor" />
        </svg>
        <svg className="pm-site-corner pm-site-corner--bottom-left" width="50" height="50" viewBox="0 0 50 50" fill="none" aria-hidden="true">
          <path d="M5.50871e-06 0C-0.00788227 37.3001 8.99616 50.0116 50 50H5.50871e-06V0Z" fill="currentColor" />
        </svg>
        <svg className="pm-site-corner pm-site-corner--bottom-right" width="50" height="50" viewBox="0 0 50 50" fill="none" aria-hidden="true">
          <path d="M5.50871e-06 0C-0.00788227 37.3001 8.99616 50.0116 50 50H5.50871e-06V0Z" fill="currentColor" />
        </svg>

        <Header />
        <ThemeSwitch />
        <SkipToContent />

        <main id="main-content" className="flex-1">
          <Hero />
          <BlurInHeadline />
          <FeaturesBento />
          <HowItWorks />
          <WorkspacePreview />
          <FAQ />
        </main>
        <Footer />
      </div>
    </LandingProviders>
  )
}
