'use client'

import Image from 'next/image'
import { LogoLoop, type LogoItem } from './LogoLoop'
import {
  ArrowRight,
  CheckCircle2,
  Check,
  Zap,
  Sparkles,
  TrendingUp,
  BarChart2,
  Users,
  ShieldCheck,
  FileText,
  Minimize2,
  X,
  Loader2,
} from 'lucide-react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useRef, type ReactNode, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

const ease = [0.23, 1, 0.32, 1] as const

const fadeInUp = {
  hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

const academicLogos: LogoItem[] = [
  { node: <span className="text-[0.9em] font-semibold tracking-tight">PubMed / NCBI</span> },
  { node: <span className="text-[0.9em] font-semibold tracking-tight">arXiv.org</span> },
  { node: <span className="text-[0.9em] font-semibold tracking-tight">Semantic Scholar</span> },
  { node: <span className="text-[0.9em] font-semibold tracking-tight">Crossref API</span> },
  { node: <span className="text-[0.9em] font-semibold tracking-tight">OpenAlex</span> },
  { node: <span className="text-[0.9em] font-semibold tracking-tight">Europe PMC</span> },
  { node: <span className="text-[0.9em] font-semibold tracking-tight">The Lancet</span> },
  { node: <span className="text-[0.9em] font-semibold tracking-tight">PLoS ONE</span> },
]

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
    if (typeof window !== 'undefined' && window.innerWidth < 850) return

    const rect = sectionRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const offsetX = (e.clientX - centerX) / (rect.width / 2)
    const offsetY = (e.clientY - centerY) / (rect.height / 2)

    mouseX.set(offsetX * 15)
    mouseY.set(offsetY * 15)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const primaryHref = user ? '/dashboard' : '/auth'

  return (
    <section
      ref={sectionRef}
      className="flex flex-col relative min-h-screen overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── HIGH-RESOLUTION SCIENTIFIC MOUNTAIN LANDSCAPE BACKGROUND ── */}
      <motion.div
        className="absolute inset-0 w-full h-[1550px] max-[850px]:h-[1350px] z-0 overflow-hidden pointer-events-none"
        style={{ x, y }}
        aria-hidden="true"
      >
        <Image
          src="/BG.jpg"
          alt="Luminar AI Scientific Neural Landscape"
          fill
          priority
          quality={100}
          className="object-cover object-top"
        />
        {/* Soft atmospheric gradient transitions */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-pm-background pointer-events-none" />
      </motion.div>

      {/* ── HERO TEXT & HEADLINE ── */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-36 sm:pt-40 max-w-4xl mx-auto text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.12, delayChildren: 0.1 }}
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neutral-200/90 bg-white/90 backdrop-blur-md text-neutral-800 text-xs font-semibold mb-6 shadow-xs"
            variants={fadeInUp}
            transition={{ duration: 0.6, ease }}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>AI-Powered Research Intelligence</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-5 text-neutral-900"
            variants={fadeInUp}
            transition={{ duration: 0.6, ease }}
          >
            Autonomous Research.
            <span className="block text-[#2e7d32] dark:text-[#388e3c]">Reliable Evidence.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-sm sm:text-base md:text-lg text-neutral-600 max-w-2xl leading-relaxed mb-8 font-normal"
            variants={fadeInUp}
            transition={{ duration: 0.6, ease }}
          >
            Luminar AI orchestrates specialized agents to search, analyze, verify, and synthesize research — so you can trust every finding.
          </motion.p>

          {/* Call to Actions */}
          <motion.div
            className="flex items-center gap-3.5 flex-wrap justify-center"
            variants={fadeInUp}
            transition={{ duration: 0.6, ease }}
          >
            <button
              type="button"
              onClick={() => router.push(primaryHref)}
              className="px-6 py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all group"
            >
              <span>Start Research</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>

            <a
              href="#how-it-works"
              className="px-6 py-3 rounded-full bg-white/90 hover:bg-white text-neutral-800 text-xs sm:text-sm font-semibold border border-neutral-200/90 shadow-sm transition-all backdrop-blur-md"
            >
              Explore Features
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* ── FLOATING SCIENTIFIC GLASS WIDGETS OVER LANDSCAPE ── */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 mt-16 sm:mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Top Left: Evidence Found */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="w-full sm:w-64 p-4 rounded-2xl bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xl border border-white/60 dark:border-neutral-700/60 shadow-lg"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 mb-2">
              <span>Evidence Found</span>
              <span className="text-neutral-400 text-xs">×</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">128</div>
                <div className="text-[10px] font-semibold text-emerald-600">+24 today</div>
              </div>
              <div className="flex items-end gap-1 h-8">
                <span className="w-1.5 h-3 bg-emerald-500/30 rounded-t-xs" />
                <span className="w-1.5 h-4 bg-emerald-500/50 rounded-t-xs" />
                <span className="w-1.5 h-6 bg-emerald-500/70 rounded-t-xs" />
                <span className="w-1.5 h-5 bg-emerald-500/60 rounded-t-xs" />
                <span className="w-1.5 h-8 bg-emerald-500 rounded-t-xs" />
              </div>
            </div>
          </motion.div>

          {/* Top Right: Research Integrity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="w-full sm:w-64 ml-auto p-4 rounded-2xl bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xl border border-white/60 dark:border-neutral-700/60 shadow-lg"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 mb-2">
              <span>Research Integrity</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  92<span className="text-xs font-normal text-neutral-400">/100</span>
                </div>
                <div className="text-[10px] font-semibold text-emerald-600">Very High</div>
              </div>
              {/* Green trend curve SVG */}
              <svg className="w-16 h-8 text-emerald-500 stroke-current fill-none stroke-2" viewBox="0 0 64 32">
                <path d="M0 24 Q 16 28, 32 16 T 64 6" />
                <circle cx="64" cy="6" r="2.5" className="fill-emerald-500" />
              </svg>
            </div>
          </motion.div>

          {/* Mid Left: Sources Verified */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="w-full sm:w-56 p-3.5 rounded-2xl bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xl border border-white/60 dark:border-neutral-700/60 shadow-lg"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 mb-1.5">
              <span>Sources Verified</span>
              <Check className="w-3 h-3 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold text-neutral-900 dark:text-white">98%</div>
                <div className="text-[10px] font-medium text-neutral-500">High Integrity</div>
              </div>
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
          </motion.div>

          {/* Mid Right: Agents Online */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="w-full sm:w-60 ml-auto p-3.5 rounded-2xl bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xl border border-white/60 dark:border-neutral-700/60 shadow-lg"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 mb-1.5">
              <span>Agents Online</span>
              <span className="text-neutral-400 text-xs">×</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold text-neutral-900 dark:text-white">6</div>
                <div className="text-[10px] font-medium text-neutral-500">Active</div>
              </div>
              <div className="flex -space-x-1.5">
                {['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500'].map((col, i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 rounded-full ${col} text-white text-[8px] font-bold flex items-center justify-center border-2 border-white`}
                  >
                    ✦
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── CENTER BOTTOM: RESEARCH IN PROGRESS GLASS PANEL ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="w-full rounded-3xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl border border-white/80 dark:border-neutral-700/80 shadow-2xl overflow-hidden p-5 sm:p-7"
        >
          {/* Window Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800 mb-5">
            <span className="text-xs font-bold text-neutral-900 dark:text-white">Research in Progress</span>
            <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
              <Minimize2 className="w-3.5 h-3.5 cursor-pointer hover:text-neutral-600" />
              <X className="w-3.5 h-3.5 cursor-pointer hover:text-neutral-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1.9fr] gap-6">
            {/* Left: Agent Pipeline Checklist */}
            <div className="space-y-3.5 pr-0 md:pr-4 border-r-0 md:border-r border-neutral-100 dark:border-neutral-800">
              {[
                { title: 'Planning', subtitle: 'Research Planner', status: 'completed' },
                { title: 'Searching', subtitle: 'Literature Searcher', status: 'completed' },
                { title: 'Extracting', subtitle: 'Evidence Extractor', status: 'completed' },
                { title: 'Verifying', subtitle: 'Citation Verifier', status: 'completed' },
                { title: 'Critiquing', subtitle: 'Research Critic', status: 'in_progress' },
                { title: 'Writing', subtitle: 'Report Writer', status: 'pending' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        step.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700 font-bold'
                          : step.status === 'in_progress'
                          ? 'bg-neutral-900 text-white'
                          : 'border border-neutral-300 text-neutral-300'
                      }`}
                    >
                      {step.status === 'completed' ? '✓' : step.status === 'in_progress' ? '●' : '○'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">{step.title}</div>
                      <div className="text-[10px] text-neutral-400 leading-none">{step.subtitle}</div>
                    </div>
                  </div>
                  {step.status === 'completed' && (
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[9px] font-bold">
                      ✓
                    </span>
                  )}
                  {step.status === 'in_progress' && (
                    <Loader2 className="w-3.5 h-3.5 text-neutral-700 animate-spin" />
                  )}
                </div>
              ))}
            </div>

            {/* Right: Synthesis Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Intermittent fasting and insulin sensitivity
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">Analyzing 128 sources from 6 databases</p>
              </div>

              {/* Skeleton placeholders */}
              <div className="space-y-2">
                <div className="h-2 w-11/12 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                <div className="h-2 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
              </div>

              {/* Key findings summary */}
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 space-y-1.5">
                <div className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">Key Findings</div>
                <ul className="text-[10px] text-neutral-600 dark:text-neutral-400 space-y-1 pl-1">
                  <li>• Significant improvement in insulin sensitivity</li>
                  <li>• Optimal window: 14:10 to 16:8</li>
                  <li>• Strong evidence from RCTs</li>
                </ul>
              </div>

              {/* Footer status */}
              <div className="flex items-center justify-between text-[10px] pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 font-medium">24 citations</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                  High Confidence
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── ACADEMIC LOGOS TICKER ── */}
      <motion.div
        className="relative z-10 pt-20 pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
      >
        <p className="text-center text-[10px] text-neutral-500 font-mono uppercase tracking-widest mb-4">
          Direct academic repositories & publication graphs
        </p>
        <LogoLoop logos={academicLogos} speed={60} logoHeight={42} gap={124} />
      </motion.div>
    </section>
  )
}
