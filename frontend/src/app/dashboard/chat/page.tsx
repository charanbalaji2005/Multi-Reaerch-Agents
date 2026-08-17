'use client'

import { useState, useRef, useEffect, useCallback, Suspense, type FormEvent, type KeyboardEvent } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass,
  BookOpen,
  Dna,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Send,
  Square,
  Copy,
  Check,
  RefreshCw,
  ArrowDown,
  Sparkles,
  Bot,
  Terminal,
  ExternalLink,
  ChevronRight,
  Plus,
  Trash2,
} from 'lucide-react'
import { api } from '@/lib/api'

interface AgentDef {
  id: string
  name: string
  role: string
  icon: any
  color: string
  bgLight: string
  accentColor: string
  description: string
  starterPrompts: string[]
}

const SCIENTIFIC_AGENTS: AgentDef[] = [
  {
    id: 'planner',
    name: 'Research Planner',
    role: 'Lead Scientific Architect',
    icon: Compass,
    color: '#6366f1',
    bgLight: 'rgba(99, 102, 241, 0.12)',
    accentColor: '#818cf8',
    description: 'Specializes in Boolean query strategies, PICO/PECO frameworks, and systematic research protocols.',
    starterPrompts: [
      'Construct a systematic Boolean search strategy for GLP-1 agonists and renal outcomes in PubMed & arXiv.',
      'Define rigorous inclusion/exclusion criteria for evaluating ZK-SNARK rollups latency.',
      'Formulate a 4-quadrant scientific matrix comparing mRNA vs viral vector vaccine durability.',
      'What are the optimal search terms and MeSH headings for CRISPR base editing in thalassemia?',
    ],
  },
  {
    id: 'literature',
    name: 'Literature Searcher',
    role: 'Academic Retrieval Specialist',
    icon: BookOpen,
    color: '#3b82f6',
    bgLight: 'rgba(59, 130, 246, 0.12)',
    accentColor: '#60a5fa',
    description: 'Expert in cross-querying PubMed Central, arXiv Atom feeds, IEEE Xplore, Semantic Scholar, and Crossref registries.',
    starterPrompts: [
      'Find the top 5 landmark meta-analyses published on intermittent fasting and HbA1c since 2021.',
      'What are the primary DOIs and authors behind recent transformer quadratic complexity reductions?',
      'Retrieve high-impact peer-reviewed trials evaluating microplastic tissue penetration.',
      'Identify key preprints and journal publications on room-temperature nickelate superconductivity.',
    ],
  },
  {
    id: 'evidence',
    name: 'Evidence Extractor',
    role: 'Statistical Metrics Analyst',
    icon: Dna,
    color: '#06b6d4',
    bgLight: 'rgba(6, 182, 212, 0.12)',
    accentColor: '#22d3ee',
    description: 'Extracts empirical data, sample sizes (N), odds ratios (OR), hazard ratios (HR), p-values, and 95% confidence intervals.',
    starterPrompts: [
      'Format the key statistical endpoints (HR, p-value, sample size N) of GLP-1 trials into a comparison table.',
      'Extract effect sizes and statistical significance levels for intermittent fasting vs continuous restriction.',
      'Compare sample sizes and statistical power across recent CAR-T cell exhaustion studies.',
      'Construct a summary table of computational complexity benchmarks for sparse attention variants.',
    ],
  },
  {
    id: 'verifier',
    name: 'Citation Verifier',
    role: 'Grounding & Anti-Hallucination Guard',
    icon: ShieldCheck,
    color: '#10b981',
    bgLight: 'rgba(16, 185, 129, 0.12)',
    accentColor: '#34d399',
    description: 'Audits scientific claims against primary literature, validates DOIs, and flags ungrounded assertions.',
    starterPrompts: [
      'Audit this claim: "Intermittent fasting reduces all-cause mortality by 40% in non-diabetic adults."',
      'Verify whether the provided DOI 10.1056/NEJMoa2100880 genuinely supports clinical remission.',
      'How does ResearchGuard detect and flag hallucinated or fabricated citations?',
      'Perform a step-by-step calibration audit on claim-to-source evidence alignment.',
    ],
  },
  {
    id: 'critic',
    name: 'Adversarial Critic',
    role: 'Peer Review Stress-Tester',
    icon: AlertTriangle,
    color: '#f59e0b',
    bgLight: 'rgba(245, 158, 11, 0.12)',
    accentColor: '#fbbf24',
    description: 'Relentlessly identifies confounding variables, selection bias, correlation vs causation fallacies, and sample size limits.',
    starterPrompts: [
      'What are the primary methodological vulnerabilities and confounding variables in observational microbiome studies?',
      'Stress-test this finding for survival bias and correlation vs causation errors.',
      'Identify critical limitations in sample size and demographic generalizability for recent AI drug discovery models.',
      'What alternative mechanisms could explain the reported reduction in inflammatory biomarkers?',
    ],
  },
  {
    id: 'writer',
    name: 'Report Writer',
    role: 'Scientific Synthesis Lead',
    icon: FileCheck2,
    color: '#8b5cf6',
    bgLight: 'rgba(139, 92, 246, 0.12)',
    accentColor: '#a78bfa',
    description: 'Synthesizes audited multi-agent findings into executive briefings, structured IMRaD dossiers, and publication abstracts.',
    starterPrompts: [
      'Synthesize an executive briefing on the state of quantum error correction surface codes.',
      'Draft a structured IMRaD introduction and methodology section for a systematic review protocol.',
      'Summarize the consensus, controversies, and open research questions regarding GLP-1 cardiovascular safety.',
      'Write a 250-word scientific abstract summarizing multi-agent citation verification methodology.',
    ],
  },
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  displayedContent?: string
  isWriting?: boolean
  error?: boolean
  parentPrompt?: string
}

function ChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialAgentId = searchParams.get('agent') || 'planner'
  const [activeAgentId, setActiveAgentId] = useState<string>(initialAgentId)

  // Map messages per agent
  const [agentChats, setAgentChats] = useState<Record<string, Message[]>>({})
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isUserScrolledUpRef = useRef(false)

  const currentAgent = SCIENTIFIC_AGENTS.find((a) => a.id === activeAgentId) || SCIENTIFIC_AGENTS[0]
  const currentMessages = agentChats[activeAgentId] || []

  // Update agent from URL parameter
  useEffect(() => {
    const urlAgent = searchParams.get('agent')
    if (urlAgent && SCIENTIFIC_AGENTS.some((a) => a.id === urlAgent)) {
      setActiveAgentId(urlAgent)
    }
  }, [searchParams])

  // Cleanup typewriter timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current)
      }
    }
  }, [])

  const scrollToBottom = useCallback((smooth = true) => {
    if (!messagesContainerRef.current) return
    const { scrollHeight, clientHeight } = messagesContainerRef.current
    messagesContainerRef.current.scrollTo({
      top: scrollHeight - clientHeight,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }, [])

  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight)
    if (distanceToBottom > 100) {
      isUserScrolledUpRef.current = true
      setShowScrollBottom(true)
    } else {
      isUserScrolledUpRef.current = false
      setShowScrollBottom(false)
    }
  }

  // Typewriter text reveal
  const revealResponseProgressively = useCallback(
    (agentId: string, messageId: string, fullText: string) => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current)
      }

      const words = fullText.match(/\S+|\s+/g) || [fullText]
      let currentIdx = 0
      let accumulated = ''

      animationTimerRef.current = setInterval(() => {
        if (currentIdx < words.length) {
          const chunk = words.slice(currentIdx, currentIdx + 2).join('')
          accumulated += chunk
          currentIdx += 2

          setAgentChats((prev) => ({
            ...prev,
            [agentId]: (prev[agentId] || []).map((msg) =>
              msg.id === messageId ? { ...msg, displayedContent: accumulated, isWriting: true } : msg
            ),
          }))

          if (!isUserScrolledUpRef.current) {
            scrollToBottom(true)
          }
        } else {
          if (animationTimerRef.current) {
            clearInterval(animationTimerRef.current)
            animationTimerRef.current = null
          }
          setAgentChats((prev) => ({
            ...prev,
            [agentId]: (prev[agentId] || []).map((msg) =>
              msg.id === messageId ? { ...msg, displayedContent: fullText, isWriting: false } : msg
            ),
          }))
          setIsThinking(false)
          if (!isUserScrolledUpRef.current) {
            scrollToBottom(true)
          }
        }
      }, 20)
    },
    [scrollToBottom]
  )

  const handleSendMessage = async (promptText?: string, targetAssistantMsgId?: string) => {
    const textToSend = (promptText || inputValue).trim()
    if (!textToSend || isThinking) return

    const agentId = activeAgentId
    const userMsgId = `user-${Date.now()}`
    const assistantMsgId = targetAssistantMsgId || `assistant-${Date.now()}`

    if (!targetAssistantMsgId) {
      const userMessage: Message = { id: userMsgId, role: 'user', content: textToSend }
      const placeholderAssistant: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        displayedContent: '',
        isWriting: true,
        parentPrompt: textToSend,
      }

      setAgentChats((prev) => ({
        ...prev,
        [agentId]: [...(prev[agentId] || []), userMessage, placeholderAssistant],
      }))
      setInputValue('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } else {
      setAgentChats((prev) => ({
        ...prev,
        [agentId]: (prev[agentId] || []).map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: '', displayedContent: '', isWriting: true, error: false }
            : msg
        ),
      }))
    }

    setIsThinking(true)
    isUserScrolledUpRef.current = false
    setShowScrollBottom(false)
    setTimeout(() => scrollToBottom(true), 50)

    try {
      const res = await api.agentChat({
        agent: agentId,
        question: textToSend,
      })
      const answer = res?.answer || res?.data?.answer || res || 'No response returned from agent.'
      revealResponseProgressively(agentId, assistantMsgId, answer)
    } catch (err: any) {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current)
        animationTimerRef.current = null
      }
      setIsThinking(false)
      setAgentChats((prev) => ({
        ...prev,
        [agentId]: (prev[agentId] || []).map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                error: true,
                isWriting: false,
                content: 'Failed to communicate with specialized agent. Please check your network and try again.',
                displayedContent: 'Failed to communicate with specialized agent. Please check your network and try again.',
              }
            : msg
        ),
      }))
    }
  }

  const handleClearChat = () => {
    setAgentChats((prev) => ({
      ...prev,
      [activeAgentId]: [],
    }))
  }

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMsgId(msgId)
    setTimeout(() => setCopiedMsgId(null), 2000)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }

  const AgentIcon = currentAgent.icon

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto h-[calc(100vh-4rem)] flex flex-col space-y-4">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-pm-accent text-black uppercase">
              Agent Co-Pilot Hub
            </span>
            <span className="text-xs text-pm-muted-foreground">• Direct Interrogation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-pm-foreground">
            Specialized Scientific AI Agents
          </h1>
        </div>

        {currentMessages.length > 0 && (
          <button
            type="button"
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-pm-border bg-pm-frame hover:bg-rose-500/10 hover:border-rose-500/30 text-pm-muted-foreground hover:text-rose-500 text-xs font-semibold transition-all self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Channel</span>
          </button>
        )}
      </div>

      {/* ── AGENT SELECTOR PILLS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 shrink-0">
        {SCIENTIFIC_AGENTS.map((agent) => {
          const Icon = agent.icon
          const isActive = agent.id === activeAgentId
          const msgCount = (agentChats[agent.id] || []).filter((m) => m.role === 'user').length

          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => {
                setActiveAgentId(agent.id)
                router.replace(`/dashboard/chat?agent=${agent.id}`, { scroll: false })
              }}
              className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 select-none ${
                isActive
                  ? 'bg-pm-frame border-pm-ring ring-1 ring-pm-ring shadow-sm'
                  : 'bg-pm-frame/50 border-pm-border hover:bg-pm-frame hover:border-pm-ring/30 opacity-70 hover:opacity-100'
              }`}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ backgroundColor: agent.bgLight, color: agent.color }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-pm-foreground truncate">{agent.name}</div>
                <div className="text-[10px] text-pm-muted-foreground font-mono truncate">
                  {msgCount > 0 ? `${msgCount} Qs` : agent.role.split(' ')[0]}
                </div>
              </div>
              {isActive && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: agent.color, boxShadow: `0 0 8px ${agent.color}` }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* ── MAIN CHAT COCKPIT ── */}
      <div className="bg-pm-frame border border-pm-border rounded-3xl flex-1 flex flex-col shadow-sm overflow-hidden relative min-h-0">
        {/* Agent Info Banner */}
        <div className="px-5 py-3 border-b border-pm-border bg-pm-frame/80 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: currentAgent.bgLight, color: currentAgent.color }}
            >
              <AgentIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-pm-foreground tracking-tight">
                  {currentAgent.name}
                </span>
                <span
                  className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase"
                  style={{ backgroundColor: currentAgent.bgLight, color: currentAgent.color }}
                >
                  {currentAgent.role}
                </span>
              </div>
              <p className="text-[11px] text-pm-muted-foreground truncate max-w-xs sm:max-w-xl mt-0.5">
                {currentAgent.description}
              </p>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar bg-pm-background/30"
        >
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-pm-border"
                style={{ backgroundColor: currentAgent.bgLight, color: currentAgent.color }}
              >
                <AgentIcon className="w-7 h-7" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="text-base font-bold text-pm-foreground">
                  Consult the {currentAgent.name}
                </h3>
                <p className="text-xs text-pm-muted-foreground leading-relaxed">
                  {currentAgent.description} Ask a complex question or pick a starter prompt below:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl mt-2">
                {currentAgent.starterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="p-3 rounded-2xl bg-pm-frame border border-pm-border hover:border-pm-ring/40 text-left text-xs font-medium text-pm-foreground hover:bg-pm-muted transition-all shadow-sm flex items-start gap-2.5 group"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-pm-accent transition-transform group-hover:scale-110" />
                    <span className="line-clamp-2 leading-relaxed">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            currentMessages.map((msg) => {
              if (msg.role === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[85%] sm:max-w-xl rounded-2xl rounded-tr-sm bg-pm-foreground text-pm-background p-3.5 sm:p-4 text-xs sm:text-sm font-medium shadow-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                )
              }

              const displayText = msg.displayedContent || msg.content

              return (
                <div key={msg.id} className="flex items-start gap-3 max-w-3xl">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-1"
                    style={{ backgroundColor: currentAgent.bgLight, color: currentAgent.color }}
                  >
                    <AgentIcon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="bg-pm-frame border border-pm-border rounded-2xl rounded-tl-sm p-4 sm:p-5 shadow-sm space-y-3">
                      {msg.error ? (
                        <div className="text-rose-500 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{displayText}</span>
                        </div>
                      ) : (
                        <div className="text-xs sm:text-sm text-pm-foreground leading-relaxed whitespace-pre-wrap font-sans">
                          {displayText}
                          {msg.isWriting && (
                            <span className="inline-block w-2 h-4 bg-pm-accent animate-pulse align-middle ml-1" />
                          )}
                        </div>
                      )}
                    </div>

                    {!msg.isWriting && !msg.error && (
                      <div className="flex items-center gap-2 px-1">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-pm-muted-foreground hover:text-pm-foreground hover:bg-pm-muted transition-colors"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500 text-[11px]">Copied ✓</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>

                        {msg.parentPrompt && (
                          <button
                            type="button"
                            onClick={() => handleSendMessage(msg.parentPrompt, msg.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-pm-muted-foreground hover:text-pm-foreground hover:bg-pm-muted transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span className="text-[11px]">Regenerate</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Scroll to bottom */}
        <AnimatePresence>
          {showScrollBottom && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={() => scrollToBottom(true)}
              className="absolute bottom-20 right-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pm-foreground text-pm-background shadow-lg text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <ArrowDown className="w-3 h-3" />
              <span>New message</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-pm-border bg-pm-frame/90 backdrop-blur-md shrink-0">
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="relative flex items-end gap-2 bg-pm-background border border-pm-border focus-within:border-pm-ring/60 focus-within:ring-2 focus-within:ring-pm-ring/20 rounded-2xl p-2 transition-all"
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Ask the ${currentAgent.name} a question, request a matrix, or stress-test claims...`}
              rows={1}
              disabled={isThinking}
              className="flex-1 resize-none bg-transparent px-2.5 py-1.5 text-xs sm:text-sm text-pm-foreground placeholder:text-pm-muted-foreground focus:outline-none max-h-36 custom-scrollbar"
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isThinking}
              className="w-9 h-9 rounded-xl bg-pm-foreground text-pm-background hover:bg-pm-foreground/90 disabled:opacity-30 flex items-center justify-center shrink-0 transition-all shadow-sm group"
            >
              <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AgentChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-pm-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-pm-accent border-t-transparent animate-spin" />
            <span className="text-xs font-mono text-pm-muted-foreground uppercase">
              Loading Agent Cockpit...
            </span>
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  )
}
