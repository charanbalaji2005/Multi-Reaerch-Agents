'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, Upload, Link as LinkIcon, FileText, X, Zap, ArrowLeft,
  Search, BookOpen, CheckCircle2, AlertTriangle, Scale, Lightbulb,
  Sparkles, Loader2, Database, Dna, ArrowRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { researchAPI } from '@/lib/api'

const SCIENTIFIC_AGENTS = [
  { icon: '🎯', name: 'Planner', desc: 'Queries & specs', color: '#6366F1' },
  { icon: '🔎', name: 'Literature', desc: 'arXiv & PubMed', color: '#3B82F6' },
  { icon: '🧬', name: 'Evidence', desc: 'Empirical data', color: '#06B6D4' },
  { icon: '🔗', name: 'Verifier', desc: 'Audits citations', color: '#22C55E' },
  { icon: '🛡️', name: 'Critic', desc: 'Peer review stress-test', color: '#F59E0B' },
  { icon: '📝', name: 'Writer', desc: 'Verified report', color: '#EC4899' },
]

const RESEARCH_MODES = [
  {
    id: 'literature_review',
    icon: BookOpen,
    label: 'Literature Review',
    desc: 'Systematic academic search across arXiv, PubMed, and Crossref'
  },
  {
    id: 'citation_verification',
    icon: CheckCircle2,
    label: 'Citation Verification',
    desc: 'Rigorous claim-to-source grounding audit and verdict assignment'
  },
  {
    id: 'evidence_comparison',
    icon: Scale,
    label: 'Evidence Comparison',
    desc: 'Contrast conflicting clinical trials, cohorts, and endpoints'
  },
  {
    id: 'hypothesis_generation',
    icon: Lightbulb,
    label: 'Hypothesis Generation',
    desc: 'Formulate testable mechanisms and boundary conditions'
  },
]

const LOADING_STEPS = [
  { text: "Initializing ResearchGuard Multi-Agent Engine...", icon: ShieldCheck },
  { text: "Connecting to Groq Llama-3.3-70B & Academic APIs...", icon: Zap },
  { text: "Formulating Boolean search strategies & PubMed queries...", icon: Search },
  { text: "Deploying Literature Search & Evidence Extraction agents...", icon: Dna },
  { text: "Redirecting to Live Mission Control cockpit...", icon: Sparkles },
]

export default function ResearchPage() {
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [selectedModes, setSelectedModes] = useState<string[]>([
    'literature_review',
    'citation_verification',
    'evidence_comparison',
    'hypothesis_generation',
  ])
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [inputMode, setInputMode] = useState<'academic' | 'url' | 'file'>('academic')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    let interval: any
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev))
      }, 700)
    } else {
      setLoadingStep(0)
    }
    return () => clearInterval(interval)
  }, [loading])

  const toggleMode = (id: string) => {
    if (selectedModes.includes(id)) {
      if (selectedModes.length > 1) {
        setSelectedModes(selectedModes.filter((m) => m !== id))
      } else {
        toast('At least one audit mode must remain active', { icon: 'ℹ️' })
      }
    } else {
      setSelectedModes([...selectedModes, id])
    }
  }

  const selectAllModes = () => {
    if (selectedModes.length === RESEARCH_MODES.length) {
      setSelectedModes(['literature_review'])
    } else {
      setSelectedModes(RESEARCH_MODES.map((m) => m.id))
    }
  }

  const exampleQuestions = [
    "Does intermittent fasting improve insulin sensitivity in adults with prediabetes?",
    "What is the empirical latency and computational overhead of ZK-SNARKs vs STARKs in distributed rollups?",
    "How does GLP-1 receptor agonism affect long-term cardiovascular outcomes in non-diabetic cohorts?",
    "What are the verified scaling limits of transformer attention mechanisms under quadratic sequence lengths?"
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) {
      toast.error('Please enter a research question')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('topic', topic)
      fd.append('research_mode', selectedModes.join(','))
      if (description) fd.append('description', description)
      if (url && inputMode === 'url') fd.append('url', url)
      if (file && inputMode === 'file') fd.append('file', file)

      const res = await researchAPI.create(fd)
      toast.success('Audit started! Deploying all 6 agents...')
      setTimeout(() => {
        router.push(`/dashboard/projects/${res.data.id}`)
      }, 500)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to start research audit')
      setLoading(false)
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto relative">
      {/* Full Screen Cinematic Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-md text-center bg-pm-frame border border-pm-border p-8 rounded-3xl shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-pm-foreground text-pm-background mx-auto mb-4 flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pm-accent/20 text-pm-foreground text-xs font-mono mb-3">
                <Zap className="w-3.5 h-3.5 text-pm-accent" />
                <span>GROQ LLM 70B • MULTI-AGENT INQUIRY</span>
              </div>

              <h2 className="text-xl font-bold text-pm-foreground mb-2">
                Deploying Verification Engine
              </h2>

              <p className="text-xs text-pm-muted-foreground font-mono mb-6 h-6 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-pm-accent" />
                <span>{LOADING_STEPS[loadingStep].text}</span>
              </p>

              {/* Progress Steps Checklist */}
              <div className="space-y-2.5 text-left bg-pm-muted p-4 rounded-2xl border border-pm-border text-xs">
                {LOADING_STEPS.map((step, idx) => {
                  const isDone = idx < loadingStep
                  const isCurrent = idx === loadingStep
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 transition-opacity duration-300 ${
                        isDone ? 'text-emerald-500 font-medium' : isCurrent ? 'text-pm-foreground font-semibold' : 'text-pm-muted-foreground'
                      }`}
                    >
                      <div className="w-4 h-4 flex items-center justify-center">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : isCurrent ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-pm-accent animate-ping" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-pm-border" />
                        )}
                      </div>
                      <span className="text-xs truncate">{step.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back button & Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-sm text-pm-muted-foreground hover:text-pm-foreground transition-colors mb-4 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-pm-accent text-black">
            SCIENTIFIC INQUIRY ENGINE
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-pm-foreground mb-2">New Research Audit</h1>
        <p className="text-pm-muted-foreground text-sm">
          Ask a scientific question. Our 6 specialized agents find peer-reviewed evidence, verify citations against primary literature, stress-test claims, and generate an auditable report.
        </p>
      </motion.div>

      {/* Safety Notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="my-5 p-4 rounded-2xl flex items-start gap-3 bg-pm-muted border border-pm-border text-xs leading-relaxed"
      >
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-pm-foreground">
          <span className="font-semibold text-amber-600 dark:text-amber-400">Research Safety Protocol:</span> ResearchGuard AI is an automated scientific verification platform. Do not upload confidential, personal, patient, unpublished, or license-restricted research data.
        </div>
      </motion.div>

      {/* Agents preview */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 my-6"
      >
        {SCIENTIFIC_AGENTS.map((agent, i) => (
          <div
            key={agent.name}
            className="bg-pm-frame border border-pm-border rounded-2xl p-3 text-center shadow-sm"
          >
            <div className="text-xl mb-1">{agent.icon}</div>
            <div className="text-xs font-semibold text-pm-foreground">{agent.name}</div>
            <div className="text-[10px] text-pm-muted-foreground mt-0.5 leading-tight">{agent.desc}</div>
          </div>
        ))}
      </motion.div>

      {/* Main Form */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-pm-frame border border-pm-border rounded-3xl p-6 sm:p-8 shadow-sm"
      >
        {/* Research Question */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-pm-foreground uppercase tracking-wider">
              Research Question *
            </label>
            <span className="text-[11px] text-pm-muted-foreground">Be specific with cohorts & endpoints</span>
          </div>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Does intermittent fasting improve insulin sensitivity in adults with prediabetes?"
            className="w-full px-4 py-3 rounded-2xl bg-pm-background border border-pm-border text-pm-foreground text-sm focus:outline-none focus:ring-2 focus:ring-pm-ring focus:border-transparent transition-all resize-none"
            rows={2}
            required
          />

          {/* Example Prompts */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-[11px] text-pm-muted-foreground self-center">Try:</span>
            {exampleQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTopic(q)}
                className="text-[11px] px-3 py-1 rounded-xl bg-pm-muted text-pm-muted-foreground border border-pm-border hover:text-pm-foreground hover:border-pm-ring/50 transition-all text-left truncate max-w-xs"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Research Mode Selection (Multi-Select & Select All) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <label className="block text-xs font-semibold text-pm-foreground uppercase tracking-wider">
                Audit Mode
              </label>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-pm-accent text-black">
                {selectedModes.length === RESEARCH_MODES.length
                  ? 'All 4 Active (Full Comprehensive Audit)'
                  : `${selectedModes.length} Selected`}
              </span>
            </div>

            <button
              type="button"
              onClick={selectAllModes}
              className="text-xs font-semibold text-pm-accent hover:underline flex items-center gap-1 transition-all"
            >
              <Sparkles className="w-3 h-3" />
              <span>
                {selectedModes.length === RESEARCH_MODES.length ? 'Reset to Single' : 'Select All Modes'}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {RESEARCH_MODES.map((mode) => {
              const Icon = mode.icon
              const isSelected = selectedModes.includes(mode.id)
              return (
                <div
                  key={mode.id}
                  onClick={() => toggleMode(mode.id)}
                  className={`cursor-pointer p-3.5 rounded-2xl transition-all border select-none ${
                    isSelected
                      ? 'bg-pm-muted border-pm-ring ring-1 ring-pm-ring shadow-sm'
                      : 'bg-pm-background border-pm-border hover:border-pm-ring/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-pm-ring' : 'text-pm-muted-foreground'}`} />
                      <span className="text-xs font-bold text-pm-foreground">{mode.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isSelected ? (
                        <span className="w-2 h-2 rounded-full bg-pm-accent" />
                      ) : (
                        <span className="w-2 h-2 rounded-full border border-pm-border" />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-pm-muted-foreground leading-snug pl-6.5">{mode.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Additional Context */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-pm-foreground uppercase tracking-wider mb-2">
            Target Populations / Boundary Conditions (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add specific populations, statistical endpoints (e.g. HbA1c, p-value thresholds), or trial requirements..."
            className="w-full px-4 py-3 rounded-2xl bg-pm-background border border-pm-border text-pm-foreground text-sm focus:outline-none focus:ring-2 focus:ring-pm-ring focus:border-transparent transition-all resize-none"
            rows={2}
          />
        </div>

        {/* Additional Literature Source Input */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-pm-foreground uppercase tracking-wider mb-2">
            Supplementary Source Ingestion (optional)
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { mode: 'academic', icon: Search, label: 'Academic Discovery (arXiv, PubMed)' },
              { mode: 'url', icon: LinkIcon, label: 'DOI / URL' },
              { mode: 'file', icon: Upload, label: 'Upload PDF' },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setInputMode(mode as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all border ${
                  inputMode === mode
                    ? 'bg-pm-foreground text-pm-background font-semibold border-pm-foreground shadow-sm'
                    : 'bg-pm-muted text-pm-muted-foreground border-pm-border hover:text-pm-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {inputMode === 'url' && (
              <motion.div
                key="url"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://pubmed.ncbi.nlm.nih.gov/... or https://arxiv.org/abs/..."
                  className="w-full px-4 py-3 rounded-2xl bg-pm-background border border-pm-border text-pm-foreground text-sm focus:outline-none focus:ring-2 focus:ring-pm-ring focus:border-transparent transition-all"
                />
              </motion.div>
            )}

            {inputMode === 'file' && (
              <motion.div
                key="file"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-pm-border rounded-2xl p-6 text-center cursor-pointer hover:border-pm-ring/50 transition-all bg-pm-background"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const f = e.dataTransfer.files[0]
                    if (f) setFile(f)
                  }}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm text-pm-foreground font-medium">{file.name}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null) }}>
                        <X className="w-4 h-4 text-pm-muted-foreground hover:text-rose-500" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-pm-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium text-pm-foreground">Drop manuscript PDF, DOCX, or TXT here</p>
                      <p className="text-xs text-pm-muted-foreground mt-1">Max 50MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="w-full py-3.5 px-6 rounded-xl bg-pm-accent hover:bg-pm-accent/90 text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>DEPLOYING 6 SCIENTIFIC AGENTS...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>DEPLOY RESEARCHGUARD VERIFICATION TEAM</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </motion.form>
    </div>
  )
}
