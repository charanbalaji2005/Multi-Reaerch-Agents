'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FileText, Trash2, Clock, CheckCircle2, Loader2, AlertCircle, ExternalLink, Search, Plus, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { researchAPI } from '@/lib/api'

const STATUS_CONFIG: Record<string, any> = {
  pending: { color: '#f59e0b', icon: Clock, label: 'Pending', badgeBg: 'rgba(245,158,11,0.1)' },
  processing: { color: '#3b82f6', icon: Loader2, label: 'Processing', badgeBg: 'rgba(59,130,246,0.1)' },
  completed: { color: '#10b981', icon: CheckCircle2, label: 'Completed', badgeBg: 'rgba(16,185,129,0.1)' },
  failed: { color: '#ef4444', icon: AlertCircle, label: 'Failed', badgeBg: 'rgba(239,68,68,0.1)' },
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const router = useRouter()

  const fetchProjects = async () => {
    try {
      const r = await researchAPI.list()
      setProjects(r.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProjects() }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this research project?')) return
    try {
      await researchAPI.delete(id)
      setProjects(prev => prev.filter(p => p.id !== id))
      toast.success('Project deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filtered = projects.filter(p =>
    p.topic?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-pm-foreground">
              Research History & Audits
            </h1>
            <p className="text-sm text-pm-muted-foreground mt-1">
              Browse and inspect all past multi-agent evidence dossiers
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

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search research claims or topics..."
          className="w-full max-w-md pl-11 pr-4 py-2.5 rounded-xl bg-pm-frame border border-pm-border text-pm-foreground text-sm focus:outline-none focus:ring-2 focus:ring-pm-ring focus:border-transparent transition-all"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-pm-frame border border-pm-border rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-pm-frame border border-pm-border rounded-2xl p-16 text-center shadow-sm">
          <ShieldCheck className="w-16 h-16 text-pm-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-pm-foreground">No audits found</h3>
          <p className="text-pm-muted-foreground text-sm mt-1 mb-6">
            {search ? 'Try adjusting your search query' : 'Start your first scientific evidence verification'}
          </p>
          <button
            onClick={() => router.push('/dashboard/research')}
            className="px-6 py-2.5 rounded-xl bg-pm-foreground text-pm-background hover:bg-pm-foreground/90 font-medium text-sm inline-flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Audit</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project, i) => {
            const s = STATUS_CONFIG[project.status] || STATUS_CONFIG.pending
            const StatusIcon = s.icon
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                className="bg-pm-frame border border-pm-border rounded-2xl p-5 cursor-pointer hover:border-pm-ring/50 transition-all shadow-sm group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: s.badgeBg, border: `1px solid ${s.color}30` }}>
                      <StatusIcon className="w-5 h-5" style={{ color: s.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-pm-foreground group-hover:text-pm-ring transition-colors truncate">
                        {project.topic}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-pm-muted-foreground">
                          {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                          style={{ background: s.badgeBg, color: s.color, border: `1px solid ${s.color}30` }}>
                          {s.label}
                        </span>
                        {project.has_report && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-medium border border-emerald-500/20">
                            Report Ready
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-4 justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${project.id}`) }}
                      className="p-2 rounded-xl hover:bg-pm-muted text-pm-muted-foreground hover:text-pm-foreground transition-all"
                      title="Open Audit"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      className="p-2 rounded-xl hover:bg-rose-500/10 text-pm-muted-foreground hover:text-rose-500 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
