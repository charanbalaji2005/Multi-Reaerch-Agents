'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { BrainCircuit, ShieldCheck, FileCheck2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/lib/store'

const steps = [
  {
    icon: BrainCircuit,
    title: 'Formalize inquiry & search strategy',
    description:
      'Enter any scientific question. The Research Planner deconstructs it into targeted Boolean queries and dispatches them across arXiv, PubMed, Semantic Scholar, and Crossref.',
  },
  {
    icon: ShieldCheck,
    title: 'Empirical extraction & citation verification',
    description:
      'The Evidence Agent structures trial endpoints and sample sizes. The Citation Verifier cross-examines every claim against source abstracts and assigns a verdict.',
  },
  {
    icon: FileCheck2,
    title: 'Adversarial critique & auditable dossier',
    description:
      'The Critic Agent stress-tests for correlation vs causation. The Report Writer synthesizes a verified whitepaper with an overall Research Integrity Score.',
  },
]

function StepItem({ step, isLast }: { step: (typeof steps)[0]; isLast: boolean }): ReactNode {
  const Icon = step.icon
  return (
    <div className={`relative flex gap-5 ${isLast ? '' : 'pb-24'}`}>
      <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pm-accent" aria-hidden="true">
        <Icon className="h-5 w-5 text-black" strokeWidth={2} />
      </div>
      <div className="pt-1">
        <h3 className="text-xl font-semibold text-pm-foreground sm:text-2xl">{step.title}</h3>
        <p className="mt-2 max-w-sm text-base leading-relaxed text-pm-foreground/60">{step.description}</p>
      </div>
    </div>
  )
}

export function HowItWorks(): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user } = useAuthStore()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.3', 'end 0.7'],
  })

  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <section id="how-it-works" ref={containerRef} className="relative w-full bg-pm-background">
      <div className="mx-auto grid max-w-5xl gap-12 px-6 py-20 sm:py-24 lg:grid-cols-2 lg:gap-20">
        <div className="lg:sticky lg:top-48 lg:h-fit lg:self-start">
          <h2 className="text-4xl font-semibold tracking-tight text-pm-foreground sm:text-5xl">How it works</h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-pm-foreground/60">
            Three phases from a raw scientific question to a verifiable research dossier. No hallucinated
            citations, no unchecked claims.
          </p>
          <motion.button
            onClick={() => router.push(user ? '/dashboard/research' : '/auth')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-8 inline-flex items-center rounded-xl bg-pm-foreground px-6 py-3 text-sm font-semibold text-pm-background transition-colors hover:opacity-90"
          >
            Try it now
          </motion.button>
        </div>

        <div className="relative">
          <div className="absolute left-6 top-6 h-[calc(100%-6rem)] w-0.5 -translate-x-1/2 bg-pm-foreground/10" aria-hidden="true">
            <motion.div style={{ height: lineHeight, willChange: 'height' }} className="w-full bg-pm-accent" />
          </div>

          <ol className="relative list-none p-0 m-0">
            {steps.map((step, index) => (
              <li key={step.title}>
                <StepItem step={step} isLast={index === steps.length - 1} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
