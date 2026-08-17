'use client'

import { motion, type Transition } from 'framer-motion'
import { CircleCheck, Star, AlertTriangle, ShieldCheck, FileCheck2, Database, Dna } from 'lucide-react'
import type { ReactNode } from 'react'

const EASE = [0.23, 1, 0.32, 1] as const

const OPEN_STATS = [
  { icon: '6 AGENTS', label: 'Autonomous Pipeline', change: 'Online' },
  { icon: 'PUBMED', label: 'Primary Academic Sync', change: 'Live' },
  { icon: 'DOSSIER', label: 'Full Integrity Audit', change: 'Ready' },
]

const cardAnimation = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
}

const getCardTransition = (delay = 0): Transition => ({ duration: 0.8, ease: EASE, delay })

function PhoneMockup({ children, variant = 'full' }: { children: ReactNode; variant?: 'full' | 'compact' }): ReactNode {
  const isCompact = variant === 'compact'
  return (
    <div
      className={`relative bg-pm-background shadow-2xl border-neutral-800 overflow-hidden z-10 ${
        isCompact ? 'w-48 md:w-52 h-68 md:h-74 rounded-3xl border-4' : 'w-60 md:w-68 h-[28rem] md:h-[30rem] rounded-t-[2rem] border-6 border-b-0'
      }`}
    >
      <div className={`absolute left-1/2 -translate-x-1/2 bg-neutral-800 rounded-full z-10 ${isCompact ? 'top-2 w-16 h-4' : 'top-2 w-20 h-5'}`} aria-hidden="true" />
      {children}
    </div>
  )
}

function DecorativeCircles(): ReactNode {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      <div className="absolute size-56 border border-pm-accent/80 rounded-full" />
      <div className="absolute size-72 border border-pm-accent/60 rounded-full" />
      <div className="absolute size-88 border border-pm-accent/40 rounded-full" />
    </div>
  )
}

function LiteratureDiscoveryCard(): ReactNode {
  return (
    <motion.div {...cardAnimation} transition={getCardTransition(0)} className="group bg-pm-card-primary rounded-[2rem] p-8 pb-0 overflow-hidden min-h-[36rem] md:row-span-2 flex flex-col">
      <div className="relative z-10 text-center mb-6 transition-transform duration-500 ease-out group-hover:scale-105">
        <h3 className="text-2xl md:text-4xl font-medium text-neutral-900 leading-tight mb-3">
          Discover Every Citation Instantly
        </h3>
        <p className="text-neutral-700 text-sm max-w-sm mx-auto">
          The Literature Agent queries arXiv, PubMed, Semantic Scholar, and Crossref, scoring each source by methodological rigor.
        </p>
      </div>

      <div className="flex-1 flex justify-center items-end transition-transform duration-500 ease-out group-hover:scale-[1.02]">
        <PhoneMockup variant="full">
          <div className="absolute inset-0 bg-pm-phone-screen pt-12 px-5 flex flex-col">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono font-semibold uppercase text-neutral-500 tracking-wider">Citation Verifier</span>
            </div>
            <h4 className="text-2xl font-semibold text-neutral-900 leading-none tracking-tight">Citation</h4>
            <h4 className="text-2xl font-semibold text-neutral-900 leading-none tracking-tight mb-3">.verify()</h4>
            <p className="text-xs text-neutral-600 leading-snug mb-5">
              Cross-examining claim against source text. Match confidence: 96%. Verdict ready.
            </p>

            <div className="relative bg-gradient-to-br from-pm-accent via-pm-accent/90 to-pm-accent/60 rounded-2xl p-4 flex-1 shadow-xl overflow-hidden flex flex-col justify-between mb-4 border border-black/10">
              <svg className="absolute inset-0 size-full" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0,60 Q30,40 60,50 T100,30" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
                <path d="M0,55 Q40,35 70,45 T100,25" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
              </svg>
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-black/60 block">Audit Status</span>
                  <p className="text-base font-bold text-neutral-900 leading-tight">Claim Supported</p>
                  <p className="text-[11px] text-neutral-800 mt-1 font-medium">96% Grounding Confidence</p>
                </div>
                <CircleCheck className="w-5 h-5 text-black shrink-0" aria-hidden="true" />
              </div>
              <div className="relative z-10 pt-2 border-t border-black/10 flex items-center justify-between text-neutral-800 text-[10px] font-mono tracking-wider">
                <span>RCT METRIC</span>
                <span>18 SOURCES</span>
                <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">VERIFIED</span>
              </div>
            </div>
          </div>
        </PhoneMockup>
      </div>
    </motion.div>
  )
}

function EvidenceExtractionCard(): ReactNode {
  return (
    <motion.div {...cardAnimation} transition={getCardTransition(0.1)} className="group bg-pm-card-secondary rounded-[2rem] p-8 overflow-hidden min-h-80 relative flex flex-col md:block">
      <div className="relative z-10 max-w-56 transition-transform duration-500 ease-out group-hover:scale-105">
        <h3 className="text-xl md:text-2xl font-medium text-pm-card-foreground leading-tight mb-3">
          Structured Evidence
        </h3>
        <p className="text-pm-card-foreground-muted text-sm leading-relaxed">
          Extracts testable propositions with exact sample sizes, cohorts, and p-values, not loose summaries.
        </p>
      </div>

      <div className="relative md:absolute mt-8 md:mt-0 md:right-10 md:top-1/2 md:-translate-y-1/2 flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-105 self-center md:self-auto">
        <DecorativeCircles />
        <PhoneMockup variant="compact">
          <div className="absolute inset-0 bg-pm-phone-screen pt-8 px-3.5 flex flex-col">
            <div className="bg-white rounded-full px-2.5 py-1 mb-2.5 flex items-center gap-1.5 border border-neutral-200 shadow-sm self-start">
              <Dna className="w-3 h-3 text-pm-accent" />
              <span className="text-neutral-700 text-[10px] font-mono font-medium">effect_size(p)</span>
            </div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 mb-0.5">Extracted Endpoint</p>
            <p className="text-lg font-bold text-neutral-900 mb-2">p &lt; 0.001</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="bg-pm-accent text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">n: 2,450</span>
              <span className="bg-neutral-200 text-neutral-800 text-[10px] font-mono px-2 py-0.5 rounded-md">RCT</span>
              <span className="bg-neutral-200 text-neutral-800 text-[10px] font-mono px-2 py-0.5 rounded-md">Meta</span>
            </div>
          </div>
        </PhoneMockup>

        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-neutral-900 text-white rounded-2xl px-4 py-2.5 shadow-xl z-20 whitespace-nowrap border border-white/10">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-neutral-400 text-[10px] font-mono">Query Result</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-white">Structured Evidence</span>
            <span className="text-[10px] font-bold text-pm-accent bg-pm-accent/20 px-1.5 py-0.5 rounded">LIVE</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function AdversarialCriticCard(): ReactNode {
  return (
    <motion.div {...cardAnimation} transition={getCardTransition(0.2)} className="group bg-pm-card-secondary rounded-[2rem] p-6 md:p-8 flex flex-col items-center justify-center text-center min-h-64">
      <div className="transition-transform duration-500 ease-out group-hover:scale-105">
        <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-pm-accent text-black shadow-md">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-2xl md:text-3xl font-medium text-pm-card-foreground leading-tight">Adversarial</h3>
        <h3 className="text-2xl md:text-3xl font-medium text-pm-card-foreground leading-tight mb-4">Critic Agent</h3>
      </div>
      <div className="flex items-center gap-2 mt-1 text-pm-card-foreground-muted transition-transform duration-500 ease-out group-hover:scale-105 max-w-xs">
        <Star className="size-4 shrink-0 text-pm-accent fill-pm-accent" />
        <span className="text-xs font-medium leading-tight">
          Downgrades &quot;prevents&quot; to &quot;correlates&quot; when causal controls are missing
        </span>
      </div>
    </motion.div>
  )
}

function OpenSourceCard(): ReactNode {
  return (
    <motion.div {...cardAnimation} transition={getCardTransition(0.3)} className="group bg-pm-card-primary rounded-[2rem] p-6 md:p-8 flex flex-col min-h-64 justify-between">
      <div className="transition-transform duration-500 ease-out group-hover:scale-105">
        <h3 className="text-xl md:text-2xl font-medium text-neutral-900 leading-tight mb-2">Open & Auditable</h3>
        <p className="text-neutral-700 text-sm leading-relaxed">
          MIT licensed. Every verdict is traceable to source text, built to keep researchers honest.
        </p>
      </div>
      <div className="flex flex-col gap-2 mt-4 transition-transform duration-500 ease-out group-hover:scale-[1.02]">
        {OPEN_STATS.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between bg-pm-background rounded-xl p-3 shadow-sm border border-pm-border/40">
            <div className="flex items-center gap-2.5">
              <span className="text-[9px] font-mono font-bold text-neutral-600 bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded">{stat.icon}</span>
              <span className="text-pm-foreground text-xs font-semibold">{stat.label}</span>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{stat.change}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export function FeaturesBento() {
  return (
    <section id="agents" className="w-full px-6 py-8 mb-16 bg-pm-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-pm-muted-foreground">
            Specialized Multi-Agent Architecture
          </span>
          <h2 className="text-3xl sm:text-5xl font-medium text-pm-foreground tracking-tight mt-2">
            Engineered for scientific truth
          </h2>
          <p className="text-pm-muted-foreground text-sm max-w-2xl mx-auto mt-3">
            Instead of one chatbot drafting conclusions, ResearchGuard distributes the work across 6 specialized agents exchanging sequential state.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-4">
          <LiteratureDiscoveryCard />
          <EvidenceExtractionCard />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdversarialCriticCard />
            <OpenSourceCard />
          </div>
        </div>
      </div>
    </section>
  )
}
