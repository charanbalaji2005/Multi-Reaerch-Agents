'use client'

import Image from 'next/image'
import { ArrowRight, Mail, ShieldCheck, AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

const footerLinks = {
  platform: [
    { label: 'Mission Control', href: '/dashboard' },
    { label: 'New Verification', href: '/dashboard/research' },
    { label: 'Audit History', href: '/dashboard/projects' },
    { label: 'Sign In', href: '/auth' },
  ],
  agents: [
    { label: 'Research Planner' },
    { label: 'Literature Search' },
    { label: 'Evidence Extractor' },
    { label: 'Citation Verifier' },
    { label: 'Research Critic' },
  ],
  safety: [
    { label: 'Hallucination Control', href: '#problem' },
    { label: 'Integrity Scoring', href: '#faq' },
    { label: 'Adversarial Critic', href: '#agents' },
  ],
}

export function Footer(): ReactNode {
  return (
    <footer className="relative pt-32 mt-24 mx-2.5 max-[850px]:mx-0">
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-full max-w-5xl">
        <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl">
          <div
            className="absolute inset-0 bg-center bg-no-repeat brightness-150 blur scale-125"
            style={{ backgroundImage: 'url(/BG.jpg)', backgroundSize: '150%' }}
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col items-center text-center px-12 py-20 max-[850px]:px-6 max-[850px]:py-6 max-[850px]:pt-12">
            <h2 className="text-5xl max-[850px]:text-3xl text-neutral-900 font-bold tracking-tight max-w-2xl mb-12 max-[850px]:mb-8">
              Verify research, faster.
            </h2>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex items-center w-full max-w-md bg-white/95 backdrop-blur-md rounded-xl p-1.5 shadow-xl border border-neutral-200/80 max-[850px]:flex-col max-[850px]:p-3 max-[850px]:gap-3 max-[850px]:max-w-none"
            >
              <div className="flex items-center flex-1 w-full">
                <Mail className="w-5 h-5 text-neutral-500 ml-3 flex-none max-[850px]:ml-1" aria-hidden="true" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  aria-label="Email address"
                  className="flex-1 px-3 py-2.5 text-sm bg-transparent text-neutral-900 placeholder:text-neutral-500 focus:outline-none font-medium"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap max-[850px]:w-full max-[850px]:py-3 shadow-sm"
              >
                Get updates
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-pm-accent rounded-tr-[3rem] rounded-tl-[3rem] pt-80 pb-16 max-[850px]:pt-64">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-start justify-between gap-12 max-[850px]:flex-col max-[850px]:gap-10">
            <div className="max-w-sm">
              <a href="#" className="flex items-center gap-2 mb-3" aria-label="ResearchGuard AI home">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 overflow-hidden p-0.5 shadow-sm">
                  <Image src="/logo.png" alt="ResearchGuard AI" width={28} height={28} className="w-full h-full object-contain" />
                </div>
                <span className="text-xl font-semibold text-neutral-900 leading-none">ResearchGuard AI</span>
              </a>
              <p className="text-xs text-neutral-800/70 leading-relaxed">
                Autonomous multi-agent platform for academic literature discovery, empirical evidence
                extraction, adversarial citation verification, and auditable scientific reports.
              </p>
            </div>

            <nav className="flex gap-16 max-[850px]:gap-10 max-[850px]:flex-wrap" aria-label="Footer navigation">
              <div>
                <h3 className="text-xs font-medium text-neutral-900/50 uppercase tracking-wider mb-4">Platform</h3>
                <ul className="space-y-2">
                  {footerLinks.platform.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-neutral-900 hover:text-neutral-900/70 transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-medium text-neutral-900/50 uppercase tracking-wider mb-4">Agents</h3>
                <ul className="space-y-2">
                  {footerLinks.agents.map((link) => (
                    <li key={link.label}>
                      <span className="text-sm text-neutral-900">{link.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-medium text-neutral-900/50 uppercase tracking-wider mb-4">Safety</h3>
                <ul className="space-y-2">
                  {footerLinks.safety.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-neutral-900 hover:text-neutral-900/70 transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>

          <div className="mt-12 p-4 rounded-xl bg-black/5 border border-black/10 text-[11px] text-neutral-800 leading-relaxed flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-neutral-900 flex-shrink-0" />
            <div>
              <span className="font-semibold">Research safety disclaimer:</span> ResearchGuard AI is an
              automated evidence verification platform. It does not replace expert human peer review or
              clinical decision-making. Users must independently verify all generated claims.
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-black/10">
            <p className="text-sm text-neutral-900/50 text-center">
              &copy; {new Date().getFullYear()} ResearchGuard AI. Multi-Agent Scientific Evidence & Citation Verification Platform.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
