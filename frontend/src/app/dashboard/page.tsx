'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FlaskConical, FileText, Brain, TrendingUp, Clock, CheckCircle2, Loader2, AlertCircle, ShieldCheck, ArrowRight, Plus } from 'lucide-react'
import { researchAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string; badgeBg: string }> = {
  pending: { color: '#f59e0b', icon: Clock, label: 'Pending', badgeBg: 'rgba(245,158,11,0.1)' },
  processing: { color: '#3b82f6', icon: Loader2, label: 'Processing', badgeBg: 'rgba(59,130,246,0.1)' },
  completed: { color: '#10b981', icon: CheckCircle2, label: 'Completed', badgeBg: 'rgba(16,185,129,0.1)' },
  failed: { color: '#ef4444', icon: AlertCircle, label: 'Failed', badgeBg: 'rgba(239,68,68,0.1)' },
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    researchAPI.list().then(r => {
      setProjects(r.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const stats = {
    total: projects.length,
    completed: projects.filter(p => p.status === 'completed').length,
    processing: projects.filter(p => p.status === 'processing').length,
    reports: projects.filter(p => p.has_report).length,
  }

  const statCards = [
    { label: 'Total Audits', value: stats.total, icon: FileText, color: '#3b82f6' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: '#10b981' },
    { label: 'Processing', value: stats.processing, icon: Loader2, color: '#f59e0b' },
    { label: 'Verified Reports', value: stats.reports, icon: ShieldCheck, color: '#8b5cf6' },
  ]

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-pm-foreground">
              Mission Control
            </h1>
            <p className="text-sm text-pm-muted-foreground mt-1">
              Welcome back, <span className="font-semibold text-pm-foreground">{user?.name || 'Researcher'}</span> — ResearchGuard Multi-Agent Engine is online.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/research')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-pm-accent hover:bg-pm-accent/90 text-black font-semibold text-sm shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Research Audit</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-pm-frame border border-pm-border rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-pm-muted flex items-center justify-center">
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <TrendingUp className="w-4 h-4 text-pm-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-pm-foreground mb-1">{stat.value}</div>
            <div className="text-xs text-pm-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-pm-foreground">Recent Audits</h2>
            <button onClick={() => router.push('/dashboard/projects')} className="text-xs text-pm-muted-foreground hover:text-pm-foreground transition-colors font-medium">
              View all →
            </button>
          </div>
          <div className="space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-pm-frame border border-pm-border rounded-2xl h-18 animate-pulse" />
              ))
            ) : projects.length === 0 ? (
              <div className="bg-pm-frame border border-pm-border rounded-2xl p-10 text-center shadow-sm">
                <ShieldCheck className="w-12 h-12 text-pm-muted-foreground mx-auto mb-3" />
                <h3 className="text-base font-semibold text-pm-foreground">No scientific audits yet</h3>
                <p className="text-pm-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Start your first multi-agent research audit to verify citations and extract empirical evidence.
                </p>
                <button
                  onClick={() => router.push('/dashboard/research')}
                  className="mt-5 px-6 py-2.5 rounded-xl bg-pm-foreground text-pm-background hover:bg-pm-foreground/90 font-medium text-sm inline-flex items-center gap-2 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start First Audit</span>
                </button>
              </div>
            ) : (
              projects.slice(0, 5).map((project, i) => {
                const s = STATUS_CONFIG[project.status] || STATUS_CONFIG.pending
                const StatusIcon = s.icon
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                    className="bg-pm-frame border border-pm-border rounded-2xl p-4 cursor-pointer hover:border-pm-ring/50 transition-all shadow-sm group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: s.badgeBg, border: `1px solid ${s.color}30` }}>
                          <StatusIcon className="w-4 h-4" style={{ color: s.color }} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-pm-foreground truncate group-hover:text-pm-ring transition-colors">
                            {project.topic}
                          </div>
                          <div className="text-xs text-pm-muted-foreground mt-0.5">
                            {new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        {project.has_report && (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Report Ready
                          </span>
                        )}
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: s.badgeBg, color: s.color, border: `1px solid ${s.color}30` }}>
                          {s.label}
                        </span>
                        <ArrowRight className="w-4 h-4 text-pm-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>

        {/* Quick Launch & Agent Overview */}
        <div className="space-y-6">
          <div className="bg-pm-frame border border-pm-border rounded-2xl p-6 shadow-sm">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-pm-foreground text-pm-background mx-auto mb-3 flex items-center justify-center shadow-md">
                <FlaskConical className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-pm-foreground text-base">Launch New Audit</h3>
              <p className="text-xs text-pm-muted-foreground mt-1">Deploy 6 autonomous agents on any scientific claim or topic</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/research')}
              className="w-full py-3 px-4 rounded-xl bg-pm-accent hover:bg-pm-accent/90 text-black font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>DEPLOY 6 AGENTS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Agent status overview */}
          <div className="bg-pm-frame border border-pm-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-pm-foreground">Agent Status</h3>
              <span className="text-[10px] font-mono uppercase bg-pm-muted px-2 py-0.5 rounded text-pm-muted-foreground">All Ready</span>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Research Planner', desc: 'Strategy & queries', color: '#6366f1' },
                { name: 'Literature Search', desc: 'PubMed / arXiv', color: '#3b82f6' },
                { name: 'Evidence Extraction', desc: 'Empirical data', color: '#06b6d4' },
                { name: 'Citation Verifier', desc: 'Grounding audits', color: '#10b981' },
                { name: 'Research Critic', desc: 'Bias & methodology', color: '#f59e0b' },
                { name: 'Report Writer', desc: 'Dossier synthesis', color: '#8b5cf6' },
              ].map((agent) => (
                <div key={agent.name} className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-pm-muted transition-colors">
                  <span className="text-xs font-medium text-pm-foreground">{agent.name}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: agent.color }} />
                    <span className="text-[11px] text-pm-muted-foreground font-mono">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
