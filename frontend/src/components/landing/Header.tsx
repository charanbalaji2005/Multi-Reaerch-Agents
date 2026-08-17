'use client'

import Image from 'next/image'
import { ArrowDownRight, ChevronDown, ShieldCheck } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { useAuthStore } from '@/lib/store'

const menus = {
  platform: [
    { label: '6 Agent Architecture', description: 'Planner, Literature, Evidence, Verifier, Critic, and Report Writer agents', href: '#agents' },
    { label: 'Verification Workflow', description: 'See how a claim goes from question to audited dossier', href: '#how-it-works' },
    { label: 'Mission Control', description: 'Open the live research dashboard', href: '/dashboard' },
    { label: 'New Verification', description: 'Start a new evidence-grounded research run', href: '/dashboard/research' },
  ],
  resources: [
    { label: 'The Hallucination Problem', description: 'Why standard LLM citations can\u2019t be trusted', href: '#problem' },
    { label: 'FAQ', description: 'Common questions about scoring and sources', href: '#faq' },
    { label: 'GitHub', description: 'Open-source repository and setup guide', href: 'https://github.com' },
  ],
} as const

const ease = [0.23, 1, 0.32, 1] as const

function HamburgerIcon({ isOpen }: { isOpen: boolean }): ReactNode {
  return (
    <div className="w-8 h-4 relative flex flex-col justify-between cursor-pointer">
      <motion.span
        className="block h-0.5 w-full bg-pm-foreground origin-center rounded-full"
        animate={isOpen ? { rotate: 45, y: 4.5 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.25, ease }}
      />
      <motion.span
        className="block h-0.5 w-full bg-pm-foreground origin-center rounded-full"
        animate={isOpen ? { rotate: -45, y: -9.5 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.25, ease }}
      />
    </div>
  )
}

function DesktopDropdown({
  label,
  menuKey,
  isOpen,
  onOpen,
  onClose,
}: {
  label: string
  menuKey: keyof typeof menus
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}): ReactNode {
  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button
        className="flex items-center gap-1 px-4 py-2 max-[1200px]:px-3 text-sm font-medium text-pm-foreground/80 hover:text-pm-foreground transition-colors rounded-full hover:bg-pm-foreground/5"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown className="w-4 h-4" aria-hidden="true" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease }}
            className="absolute top-full left-0 pt-2 w-80"
          >
            <div className="bg-pm-frame border border-pm-border rounded-2xl shadow-lg overflow-hidden p-2">
              {menus[menuKey].map((item) => (
                <a key={item.label} href={item.href} className="block px-4 py-3 rounded-xl hover:bg-pm-muted transition-colors">
                  <div className="text-sm font-medium text-pm-foreground">{item.label}</div>
                  <div className="text-xs text-pm-muted-foreground mt-0.5">{item.description}</div>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MobileExpandable({
  label,
  menuKey,
  isExpanded,
  onToggle,
  onClose,
}: {
  label: string
  menuKey: keyof typeof menus
  isExpanded: boolean
  onToggle: () => void
  onClose: () => void
}): ReactNode {
  return (
    <div className="border-b border-pm-foreground/10">
      <button
        className="flex items-center justify-between py-4 w-full text-base font-medium text-pm-foreground"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        {label}
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-pm-muted-foreground" aria-hidden="true" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-2 space-y-1">
              {menus[menuKey].map((item) => (
                <a key={item.label} href={item.href} className="block py-2 text-sm text-pm-foreground/80 hover:text-pm-foreground" onClick={onClose}>
                  {item.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const CornerSVG = ({ className }: { className: string }) => (
  <svg className={className} width="50" height="50" viewBox="0 0 50 50" fill="none" aria-hidden="true">
    <path d="M5.50871e-06 0C-0.00788227 37.3001 8.99616 50.0116 50 50H5.50871e-06V0Z" fill="currentColor" />
  </svg>
)

export function Header(): ReactNode {
  const router = useRouter()
  const { user } = useAuthStore()
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)

  const closeMobile = () => setMobileMenuOpen(false)
  const toggleExpanded = (key: string) => setMobileExpanded(mobileExpanded === key ? null : key)

  const primaryHref = user ? '/dashboard' : '/auth'
  const primaryLabel = user ? 'Mission Control' : 'Launch App'

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="fixed top-0 inset-x-0 mx-auto w-full max-w-5xl lg:max-w-6xl bg-pm-frame z-50 rounded-b-[2rem] shadow-lg border-b border-pm-border/20 max-[850px]:w-full max-[850px]:max-w-none max-[850px]:rounded-none max-[850px]:rounded-b-[2rem] max-[850px]:border-b-0"
    >
      <div className="h-20 max-[850px]:h-18 flex items-center justify-between px-6 sm:px-8">
        <button onClick={() => router.push('/')} className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pm-frame border border-pm-border shadow-sm overflow-hidden p-0.5">
            <Image src="/logo.png" alt="ResearchGuard AI Logo" width={32} height={32} className="w-full h-full object-contain" priority />
          </div>
          <span className="text-lg font-semibold text-pm-foreground tracking-tight leading-none">
            ResearchGuard AI
          </span>
        </button>

        <nav className="flex items-center gap-1 max-[850px]:hidden">
          <DesktopDropdown
            label="Platform"
            menuKey="platform"
            isOpen={activeMenu === 'platform'}
            onOpen={() => setActiveMenu('platform')}
            onClose={() => setActiveMenu(null)}
          />
          <DesktopDropdown
            label="Resources"
            menuKey="resources"
            isOpen={activeMenu === 'resources'}
            onOpen={() => setActiveMenu('resources')}
            onClose={() => setActiveMenu(null)}
          />
          <a href="#faq" className="px-4 py-2 text-sm font-medium text-pm-foreground/80 hover:text-pm-foreground transition-colors rounded-full hover:bg-pm-foreground/5">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-4 shrink-0 max-[850px]:hidden">
          {!user && (
            <button onClick={() => router.push('/auth')} className="text-sm font-medium text-pm-foreground/80 hover:text-pm-foreground transition-colors px-2 py-1">
              Sign In
            </button>
          )}
          <button onClick={() => router.push(primaryHref)} className="group relative cursor-pointer inline-flex items-center">
            <span className="absolute right-0 inset-y-0 w-[calc(100%-1.5rem)] rounded-xl bg-pm-accent" />
            <span className="relative z-10 px-5 py-2.5 sm:py-3 rounded-xl bg-pm-foreground text-pm-background text-sm font-medium whitespace-nowrap">{primaryLabel}</span>
            <span className="relative -left-px z-10 w-10 h-10 rounded-xl flex items-center justify-center text-black">
              <ArrowDownRight className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-45" />
            </span>
          </button>
        </div>

        <button
          className="hidden max-[850px]:flex items-center justify-center w-10 h-10 text-pm-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          <HamburgerIcon isOpen={mobileMenuOpen} />
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="hidden max-[850px]:block overflow-hidden bg-pm-frame"
          >
            <div className="px-6 pb-6 pt-2">
              <nav className="space-y-0">
                <MobileExpandable
                  label="Platform"
                  menuKey="platform"
                  isExpanded={mobileExpanded === 'platform'}
                  onToggle={() => toggleExpanded('platform')}
                  onClose={closeMobile}
                />
                <MobileExpandable
                  label="Resources"
                  menuKey="resources"
                  isExpanded={mobileExpanded === 'resources'}
                  onToggle={() => toggleExpanded('resources')}
                  onClose={closeMobile}
                />
                <a href="#faq" className="flex items-center justify-between py-4 text-base font-medium text-pm-foreground border-b border-pm-foreground/10" onClick={closeMobile}>
                  FAQ
                </a>
              </nav>

              <div className="flex items-center justify-between pt-6 pb-2">
                {!user && (
                  <button onClick={() => { closeMobile(); router.push('/auth') }} className="text-base font-medium text-pm-foreground">
                    Sign In
                  </button>
                )}
                <button
                  onClick={() => { closeMobile(); router.push(primaryHref) }}
                  className="group relative cursor-pointer inline-flex items-center ml-auto"
                >
                  <span className="absolute right-0 inset-y-0 w-[calc(100%-1.5rem)] rounded-2xl bg-pm-accent" />
                  <span className="relative z-10 px-5 py-3 rounded-2xl bg-pm-foreground text-pm-background text-sm font-medium">{primaryLabel}</span>
                  <span className="relative -left-px z-10 w-10 h-10 rounded-2xl flex items-center justify-center text-pm-foreground">
                    <ArrowDownRight className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-45" />
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CornerSVG className="absolute top-0 right-full w-[50px] h-[50px] rotate-180 text-pm-frame pointer-events-none max-[850px]:hidden" />
      <CornerSVG className="absolute top-0 left-full w-[50px] h-[50px] rotate-90 text-pm-frame pointer-events-none max-[850px]:hidden" />
    </motion.header>
  )
}
