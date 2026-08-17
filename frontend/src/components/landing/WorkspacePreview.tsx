'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Dna,
  BookOpen,
  Compass,
  ArrowRight,
  ExternalLink,
  Zap,
  Scale,
  Sparkles,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export function WorkspacePreview() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [selectedVerdict, setSelectedVerdict] = useState<'all' | 'supported' | 'partial' | 'unsupported'>('all')

  const sampleEvidence = [
    {
      id: 'EV-01',
      claim: 'Intermittent fasting induces clinically significant reductions in fasting insulin and HOMA-IR in prediabetic cohorts.',
      verdict: 'SUPPORTED',
      confidence: 98,
      source: 'The Lancet Diabetes & Endocrinology (2024)',
      metric: 'n = 1,420 • Double-Blind RCT • p < 0.001',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'EV-02',
      claim: 'Time-restricted eating permanently reverses non-alcoholic fatty liver disease (NAFLD) independent of caloric restriction.',
      verdict: 'PARTIAL',
      confidence: 64,
      source: 'Nature Medicine (2023)',
      metric: 'n = 310 • Multi-Arm Trial • p = 0.042',
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      id: 'EV-03',
      claim: 'Circadian fasting protocols prevent microvascular diabetic complications without pharmacotherapy.',
      verdict: 'UNSUPPORTED',
      confidence: 12,
      source: 'Crossref Citation Audit #84920',
      metric: 'Confounding variables unadjusted • Overconfident claim',
      badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
  ]

  const filteredEvidence = sampleEvidence.filter((e) => {
    if (selectedVerdict === 'all') return true
    if (selectedVerdict === 'supported') return e.verdict === 'SUPPORTED'
    if (selectedVerdict === 'partial') return e.verdict === 'PARTIAL'
    if (selectedVerdict === 'unsupported') return e.verdict === 'UNSUPPORTED'
    return true
  })

  return (
    <section className="w-full py-20 px-6 bg-pm-background border-t border-pm-border">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pm-accent/20 text-xs font-mono font-bold text-pm-foreground mb-4">
            <Sparkles className="w-3.5 h-3.5 text-pm-accent" />
            <span>INTERACTIVE WORKSPACE PREVIEW</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-pm-foreground">
            From raw inquiries to audited whitepapers
          </h2>
          <p className="text-pm-muted-foreground text-sm sm:text-base mt-4 leading-relaxed">
            Inspect live evidence matrices, claim-to-source grounding graphs, and calibrated integrity scores before exporting peer-reviewed dossiers.
          </p>
        </div>

        {/* ── 1. AGENT COCKPIT WORKSPACE PREVIEW ── */}
        <div className="bg-pm-frame border border-pm-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-pm-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pm-foreground text-pm-background flex items-center justify-center shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-pm-foreground flex items-center gap-2">
                  <span>Live Research Dossier #8492</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pm-accent text-black font-semibold uppercase">
                    Audited
                  </span>
                </div>
                <p className="text-xs text-pm-muted-foreground mt-0.5">
                  Query: &quot;Metabolic efficacy of time-restricted feeding vs continuous restriction&quot;
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-pm-muted border border-pm-border text-xs font-mono">
                <span className="text-pm-muted-foreground">Integrity Score:</span>
                <span className="font-bold text-pm-foreground text-sm">94/100</span>
              </div>
              <button
                type="button"
                onClick={() => router.push(user ? '/dashboard/research' : '/auth')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pm-foreground text-pm-background hover:bg-pm-foreground/90 font-semibold text-xs transition-all shadow-sm"
              >
                <span>Launch Cockpit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Evidence Filter Pills */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-pm-foreground">
                Verified Empirical Claims
              </span>
              <div className="flex bg-pm-muted p-1 rounded-xl border border-pm-border text-xs font-mono">
                {(['all', 'supported', 'partial', 'unsupported'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedVerdict(filter)}
                    className={`px-3 py-1 rounded-lg capitalize transition-all ${
                      selectedVerdict === filter
                        ? 'bg-pm-foreground text-pm-background font-semibold shadow-sm'
                        : 'text-pm-muted-foreground hover:text-pm-foreground'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Claims List */}
            <div className="space-y-3">
              {filteredEvidence.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 sm:p-5 rounded-2xl bg-pm-background/70 border border-pm-border hover:border-pm-ring/40 transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <p className="text-xs sm:text-sm font-semibold text-pm-foreground leading-snug">
                      &quot;{ev.claim}&quot;
                    </p>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${ev.badge}`}>
                      {ev.verdict} ({ev.confidence}%)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-pm-border text-[11px] text-pm-muted-foreground font-mono">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-pm-accent" />
                      <span className="text-pm-foreground/90 font-medium">{ev.source}</span>
                    </div>
                    <span>{ev.metric}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 2. AUDITABLE REPORT & 6 AGENTS GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-pm-frame border border-pm-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-pm-muted flex items-center justify-center mb-4">
                <Dna className="w-5 h-5 text-pm-accent" />
              </div>
              <h3 className="text-base font-bold text-pm-foreground mb-1">Empirical Synthesis</h3>
              <p className="text-xs text-pm-muted-foreground leading-relaxed">
                Quantitative effect sizes, confidence intervals, and endpoints extracted from multi-trial cohorts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-pm-border text-[11px] font-mono text-pm-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Full Meta-Analysis Sync</span>
            </div>
          </div>

          <div className="bg-pm-frame border border-pm-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-pm-muted flex items-center justify-center mb-4">
                <Scale className="w-5 h-5 text-pm-accent" />
              </div>
              <h3 className="text-base font-bold text-pm-foreground mb-1">Adversarial Critic</h3>
              <p className="text-xs text-pm-muted-foreground leading-relaxed">
                Automated detection of confounding variables, sample size limits, and correlational claims.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-pm-border text-[11px] font-mono text-pm-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Causal Fallacy Filter</span>
            </div>
          </div>

          <div className="bg-pm-frame border border-pm-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-pm-muted flex items-center justify-center mb-4">
                <FileCheck2 className="w-5 h-5 text-pm-accent" />
              </div>
              <h3 className="text-base font-bold text-pm-foreground mb-1">Exportable Dossiers</h3>
              <p className="text-xs text-pm-muted-foreground leading-relaxed">
                Publish-ready whitepapers, citation trees, and interactive Mermaid graphs with 100% auditable links.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-pm-border text-[11px] font-mono text-pm-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pm-accent" />
              <span>PDF & Markdown Ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
