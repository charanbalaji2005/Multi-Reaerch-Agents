'use client'

import { LogoLoop, type LogoItem } from './LogoLoop'
import { ArrowDownRight, CheckCircle2, AlertTriangle, Zap } from 'lucide-react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useRef, type ReactNode, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

const ease = [0.23, 1, 0.32, 1] as const

const fadeInUp = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.95, filter: 'blur(8px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
}

const academicLogos: LogoItem[] = [
  { node: <span className="text-[0.9em] font-semibold tracking-tight">PubMed / NCBI</span> },
  { node: <span className="text-[0.9em] font-semibold tracking-tight">arXiv.org</span> },
  { node: <span className="text-[0.9em] font-semibold tracking-tight">Semantic Scholar</span> },
  { node: <span className="text-[0.9em] font-semibold tracking-tight">Crossref API</span> },
  { node: <span className="text-[0.9em] font-semibold tracking-tight">The Lancet</span> },
  { node: <span className="text-[0.9em] font-semibold tracking-tight">IEEE Xplore</span> },
  { node: <span className="text-[0.9em] font-semibold tracking-tight">PLoS ONE</span> },
  { node: <span className="text-[0.9em] font-semibold tracking-tight">bioRxiv / medRxiv</span> },
]

const PARALLAX_INTENSITY = 20

function HeroDashboard(): ReactNode {
  return (
    <div className="aspect-[16/9] w-full bg-neutral-950 p-5 text-white sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-pm-accent">ResearchGuard AI</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl">Claim Verification</h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pm-accent text-black">
          <Zap className="h-6 w-6" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-white/60">Live inquiry</span>
            <span className="rounded-full bg-pm-accent px-3 py-1 text-xs font-semibold text-black">6 Agents</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-black/30 p-3">
              <div>
                <p className="text-sm font-medium">Supported claim</p>
                <p className="mt-1 text-xs text-white/45">Insulin sensitivity · The Lancet Diabetes (2024)</p>
              </div>
              <span className="font-mono text-xs font-semibold text-pm-accent bg-pm-accent/10 px-2 py-1 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 96%
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-black/30 p-3">
              <div>
                <p className="text-sm font-medium">Critic audit</p>
                <p className="mt-1 text-xs text-white/45">Correlation vs causation flagged</p>
              </div>
              <span className="font-mono text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Warning
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-2xl bg-pm-accent p-4 text-black">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Zap className="h-4 w-4" />
              Integrity score
            </div>
            <p className="mt-4 text-5xl font-semibold tracking-tight">94</p>
            <p className="mt-2 text-sm text-black/60">27 claims checked across 18 sources.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-pm-accent" />
              Run cost
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              Groq Llama-3.3-70B · $0.0112 · 38s to full dossier
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Hero(): ReactNode {
  const sectionRef = useRef<HTMLElement>(null)
  const router = useRouter()
  const { user } = useAuthStore()

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 25, stiffness: 150 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (!sectionRef.current) return
    if (window.innerWidth < 850) return

    const rect = sectionRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const offsetX = (e.clientX - centerX) / (rect.width / 2)
    const offsetY = (e.clientY - centerY) / (rect.height / 2)

    mouseX.set(offsetX * PARALLAX_INTENSITY)
    mouseY.set(offsetY * PARALLAX_INTENSITY)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <section
      ref={sectionRef}
      className="flex flex-col relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="absolute inset-0 min-[850px]:inset-2.5 bg-cover bg-center bg-no-repeat -z-10 brightness-125 rounded-br-[2rem] rounded-bl-[2rem] min-[850px]:scale-105"
        style={{ backgroundImage: 'url(/BG.jpg)', x, y }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-center px-6 pt-64 max-[850px]:pt-32">
        <motion.div
          className="flex flex-col items-center max-[850px]:items-start text-center max-[850px]:text-left max-w-4xl max-[850px]:w-full"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.15, delayChildren: 0.2 }}
        >
          <motion.div
            className="inline-flex items-center gap-1.5 pl-4 pr-3 py-1.5 rounded-xl border border-black/10 bg-white text-black text-sm font-medium mb-6"
            variants={fadeInUp}
            transition={{ duration: 0.8, ease }}
          >
            Multi-Agent Scientific Evidence & Citation Verification
            <span className="text-pm-accent">+</span>
          </motion.div>

          <h1 className="text-7xl max-[850px]:text-5xl font-medium tracking-tight leading-[1.1] mb-6 text-black">
            <motion.span className="block font-bold tracking-tighter" variants={fadeInUp} transition={{ duration: 0.8, ease }}>
              ResearchGuard AI
            </motion.span>
            <motion.span className="block" variants={fadeInUp} transition={{ duration: 0.8, ease }}>
              Audit claims with <span className="italic font-serif text-pm-accent">clarity</span>
            </motion.span>
          </h1>

          <motion.p className="text-lg text-neutral-600 mb-8" variants={fadeInUp} transition={{ duration: 0.8, ease }}>
            Eliminate hallucinated papers, ungrounded citations, and overconfident conclusions. 6 autonomous
            agents plan, search peer-reviewed literature, extract empirical evidence, independently verify
            citations, and stress-test every claim.
          </motion.p>

          <motion.button
            onClick={() => router.push(user ? '/dashboard/research' : '/auth')}
            className="group relative cursor-pointer inline-flex items-center max-[850px]:w-full"
            variants={fadeInScale}
            transition={{ duration: 0.8, ease }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="absolute right-0 inset-y-0 w-[calc(100%-2rem)] max-[850px]:w-full rounded-xl bg-pm-accent" />
            <span className="relative z-10 px-6 py-3 rounded-xl bg-black text-white font-medium max-[850px]:flex-1">
              Launch research verification
            </span>
            <span className="relative -left-px z-10 w-11 h-11 rounded-xl flex items-center justify-center text-black">
              <ArrowDownRight className="w-5 h-5 transition-transform duration-300 group-hover:-rotate-45" />
            </span>
          </motion.button>
        </motion.div>
      </div>

      <motion.div
        className="relative px-6 mt-24 max-[850px]:mt-10"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6, ease }}
      >
        <div className="relative max-w-5xl mx-auto">
          <div
            className="relative rounded-2xl overflow-hidden border border-neutral-200 shadow-2xl"
            style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}
          >
            <HeroDashboard />
          </div>
        </div>
      </motion.div>

      <motion.div className="pt-24 pb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1, ease }}>
        <p className="text-center text-xs text-pm-muted-foreground font-mono uppercase tracking-widest mb-4">
          Direct academic repositories & publication graphs
        </p>
        <LogoLoop logos={academicLogos} speed={60} logoHeight={42} gap={124} />
      </motion.div>
    </section>
  )
}
