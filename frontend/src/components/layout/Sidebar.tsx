'use client'
import { useState } from 'react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  LayoutDashboard,
  FlaskConical,
  FileText,
  Compass,
  BookOpen,
  Dna,
  AlertTriangle,
  FileCheck2,
  LogOut,
  Plus,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [isAgentsOpen, setIsAgentsOpen] = useState(true)

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    router.push('/auth')
  }

  const agentPills = [
    { id: 'planner', name: 'Research Planner', icon: Compass, color: '#6366f1', desc: 'Queries & specs' },
    { id: 'literature', name: 'Literature Search', icon: BookOpen, color: '#3b82f6', desc: 'PubMed & arXiv' },
    { id: 'evidence', name: 'Evidence Extraction', icon: Dna, color: '#06b6d4', desc: 'Statistical data' },
    { id: 'verifier', name: 'Citation Verifier', icon: ShieldCheck, color: '#10b981', desc: 'Audits citations' },
    { id: 'critic', name: 'Research Critic', icon: AlertTriangle, color: '#f59e0b', desc: 'Stress-test claims' },
    { id: 'writer', name: 'Report Writer', icon: FileCheck2, color: '#8b5cf6', desc: 'Structured reports' },
  ]

  const navItems = [
    { href: '/dashboard', label: 'Mission Control', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/research', label: 'New Audit', icon: FlaskConical, exact: true },
    { href: '/dashboard/projects', label: 'Research Projects', icon: FileText, exact: false },
    { href: '/dashboard/chat', label: 'AI Agents Chat Hub', icon: Sparkles, exact: false, badge: 'Live' },
  ]

  return (
    <motion.aside
      initial={false}
      className={`fixed left-0 top-0 h-screen w-64 z-50 flex flex-col bg-pm-frame border-r border-pm-border transition-all duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Header / Brand */}
      <div className="px-5 py-4 border-b border-pm-border flex items-center justify-between">
        <button onClick={() => router.push('/')} className="flex items-center gap-2.5 text-left">
          <div className="w-8 h-8 rounded-xl bg-pm-background border border-pm-border flex items-center justify-center p-0.5 shadow-sm overflow-hidden">
            <Image src="/logo.png" alt="ResearchGuard AI" width={28} height={28} className="w-full h-full object-contain" priority />
          </div>
          <div>
            <div className="text-sm font-bold text-pm-foreground tracking-tight flex items-center gap-1.5 leading-none">
              <span>ResearchGuard</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-pm-accent text-black font-semibold uppercase font-mono">AI</span>
            </div>
            <div className="text-[10px] text-pm-muted-foreground font-medium tracking-wider uppercase mt-1">
              Scientific Audit
            </div>
          </div>
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden text-pm-muted-foreground hover:text-pm-foreground p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Workspace Section */}
        <div>
          <div className="text-[11px] font-semibold text-pm-muted-foreground uppercase tracking-wider px-3 mb-2">
            Workspace
          </div>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? 'bg-pm-foreground text-pm-background shadow-sm font-semibold'
                      : 'text-pm-muted-foreground hover:text-pm-foreground hover:bg-pm-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-pm-accent text-black uppercase">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 6 Specialized Scientific Agents Collapsible Chat Section */}
        <div>
          {/* Clickable Header Target with Accessibility & Animated Chevron */}
          <div
            role="button"
            tabIndex={0}
            aria-expanded={isAgentsOpen}
            aria-controls="ai-agents-list"
            onClick={() => setIsAgentsOpen((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setIsAgentsOpen((prev) => !prev)
              }
            }}
            className="w-full text-[11px] font-semibold text-pm-muted-foreground uppercase tracking-wider px-3 mb-2 flex items-center justify-between cursor-pointer hover:text-pm-foreground select-none transition-colors rounded-lg py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-pm-ring/40"
          >
            <div className="flex items-center gap-2">
              <span>AI AGENTS CHAT</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-emerald-500 font-semibold">6 ONLINE</span>
              <motion.div
                animate={{ rotate: isAgentsOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center text-pm-muted-foreground"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.div>
            </div>
          </div>

          {/* Smooth Collapsible Agent List */}
          <AnimatePresence initial={false}>
            {isAgentsOpen && (
              <motion.div
                id="ai-agents-list"
                key="ai-agents-list"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="bg-pm-muted/60 rounded-2xl border border-pm-border p-1.5 space-y-1">
                  {agentPills.map((agent) => {
                    const Icon = agent.icon
                    const isCurrentChat =
                      pathname.startsWith('/dashboard/chat') &&
                      typeof window !== 'undefined' &&
                      window.location.search.includes(`agent=${agent.id}`)

                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/chat?agent=${agent.id}`)
                          setIsOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all text-left group ${
                          isCurrentChat
                            ? 'bg-pm-frame border border-pm-ring shadow-sm font-semibold'
                            : 'hover:bg-pm-frame hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: `${agent.color}20`, color: agent.color }}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold text-pm-foreground truncate">{agent.name}</div>
                            <div className="text-[9px] text-pm-muted-foreground truncate">{agent.desc}</div>
                          </div>
                        </div>
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0 ml-1"
                          style={{ backgroundColor: agent.color, boxShadow: `0 0 6px ${agent.color}` }}
                        />
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Launch CTA */}
        <button
          onClick={() => {
            router.push('/dashboard/research')
            setIsOpen(false)
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-pm-accent hover:bg-pm-accent/90 text-black text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>START NEW AUDIT</span>
        </button>
      </nav>

      {/* Footer / Safety Disclaimer & User Profile */}
      <div className="p-3 border-t border-pm-border bg-pm-frame">
        {/* Safety Note */}
        <div className="mb-3 p-2 rounded-lg bg-pm-muted border border-pm-border text-[10px] text-pm-muted-foreground leading-tight">
          <span className="font-semibold text-pm-foreground block mb-0.5">Research Disclaimer:</span>
          AI-assisted verification tool. Not a substitute for clinical or expert peer review.
        </div>

        <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-pm-muted border border-pm-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-pm-foreground text-pm-background flex items-center justify-center text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'R'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-pm-foreground truncate">{user?.name || 'Researcher'}</div>
              <div className="text-[10px] text-pm-muted-foreground font-mono truncate">{user?.email || 'verified'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="text-pm-muted-foreground hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
