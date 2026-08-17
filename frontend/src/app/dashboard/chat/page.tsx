'use client'

import { useState, useRef, useEffect, useCallback, Suspense, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
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
  Copy,
  Check,
  RefreshCw,
  ArrowDown,
  Sparkles,
  Info,
  Terminal,
  ExternalLink,
  Trash2,
  Activity,
} from 'lucide-react'
import { api } from '@/lib/api'
import LuminarLoadingScreen from '@/components/ui/LuminarLoadingScreen'

interface AgentDef {
  id: string
  number: string
  name: string
  specialization: string
  badge: string
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
    number: '01',
    name: 'Research Planner',
    specialization: 'Scientific Architect',
    badge: 'LEAD SCIENTIFIC ARCHITECT',
    icon: Compass,
    color: '#6366f1',
    bgLight: 'rgba(99, 102, 241, 0.12)',
    accentColor: '#818cf8',
    description: 'Specializes in Boolean query strategies, PICO/PECO frameworks, and systematic research protocols.',
    starterPrompts: [
      'Construct a systematic Boolean search strategy for GLP-1 agonists and renal outcomes',
      'Define rigorous inclusion/exclusion criteria for evaluating ZK-SNARK rollup security',
      'Formulate a 4-quadrant scientific matrix comparing mRNA vs viral vector vaccines',
      'What are the optimal search terms and MeSH headings for CRISPR base editing?',
    ],
  },
  {
    id: 'literature',
    number: '02',
    name: 'Literature Researcher',
    specialization: 'Academic Explorer',
    badge: 'ACADEMIC RETRIEVAL SPECIALIST',
    icon: BookOpen,
    color: '#3b82f6',
    bgLight: 'rgba(59, 130, 246, 0.12)',
    accentColor: '#60a5fa',
    description: 'Expert in cross-querying PubMed Central, arXiv Atom feeds, IEEE Xplore, Semantic Scholar, and Crossref registries.',
    starterPrompts: [
      'Find the top 5 landmark meta-analyses published on intermittent fasting and HbA1c since 2021',
      'What are the primary DOIs and authors behind recent transformer quadratic complexity reductions?',
      'Retrieve high-impact peer-reviewed trials evaluating microplastic tissue penetration',
      'Identify key preprints and journal publications on room-temperature nickelate superconductivity',
    ],
  },
  {
    id: 'evidence',
    number: '03',
    name: 'Evidence Extractor',
    specialization: 'Statistical Analyst',
    badge: 'STATISTICAL METRICS ANALYST',
    icon: Dna,
    color: '#06b6d4',
    bgLight: 'rgba(6, 182, 212, 0.12)',
    accentColor: '#22d3ee',
    description: 'Extracts empirical data, sample sizes (N), odds ratios (OR), hazard ratios (HR), p-values, and 95% confidence intervals.',
    starterPrompts: [
      'Format the key statistical endpoints (HR, p-value, sample size N) of GLP-1 trials into a comparison table',
      'Extract effect sizes and statistical significance levels for intermittent fasting vs continuous restriction',
      'Compare sample sizes and statistical power across recent CAR-T cell exhaustion studies',
      'Construct a summary table of computational complexity benchmarks for sparse attention variants',
    ],
  },
  {
    id: 'verifier',
    number: '04',
    name: 'Citation Verifier',
    specialization: 'Grounding Specialist',
    badge: 'GROUNDING & ANTI-HALLUCINATION GUARD',
    icon: ShieldCheck,
    color: '#10b981',
    bgLight: 'rgba(16, 185, 129, 0.12)',
    accentColor: '#34d399',
    description: 'Audits scientific claims against primary literature, validates DOIs, and flags ungrounded assertions.',
    starterPrompts: [
      'Audit this claim: "Intermittent fasting reduces all-cause mortality by 40% in non-diabetic adults"',
      'Verify whether the provided DOI 10.1056/NEJMoa2100880 genuinely supports clinical remission',
      'How does ResearchGuard detect and flag hallucinated or fabricated citations?',
      'Perform a step-by-step calibration audit on claim-to-source evidence alignment',
    ],
  },
  {
    id: 'critic',
    number: '05',
    name: 'Adversarial Critic',
    specialization: 'Peer Review Expert',
    badge: 'PEER REVIEW STRESS-TESTER',
    icon: AlertTriangle,
    color: '#f59e0b',
    bgLight: 'rgba(245, 158, 11, 0.12)',
    accentColor: '#fbbf24',
    description: 'Relentlessly identifies confounding variables, selection bias, correlation vs causation fallacies, and sample size limits.',
    starterPrompts: [
      'What are the primary methodological vulnerabilities and confounding variables in observational microbiome studies?',
      'Stress-test this finding for survival bias and correlation vs causation errors',
      'Identify critical limitations in sample size and demographic generalizability for recent AI drug discovery models',
      'What alternative mechanisms could explain the reported reduction in inflammatory biomarkers?',
    ],
  },
  {
    id: 'writer',
    number: '06',
    name: 'Report Writer',
    specialization: 'Scientific Communicator',
    badge: 'SCIENTIFIC SYNTHESIS LEAD',
    icon: FileCheck2,
    color: '#8b5cf6',
    bgLight: 'rgba(139, 92, 246, 0.12)',
    accentColor: '#a78bfa',
    description: 'Synthesizes audited multi-agent findings into executive briefings, structured IMRaD dossiers, and publication abstracts.',
    starterPrompts: [
      'Synthesize an executive briefing on the state of quantum error correction surface codes',
      'Draft a structured IMRaD introduction and methodology section for a systematic review protocol',
      'Summarize the consensus, controversies, and open research questions regarding GLP-1 cardiovascular safety',
      'Write a 250-word scientific abstract summarizing multi-agent citation verification methodology',
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
  timestamp?: string
}

// ─── Inline Markdown with Clickable DOIs & Links ──────────────────────────────
function formatInlineLinks(text: string): ReactNode {
  if (!text) return ''
  const parts: (string | JSX.Element)[] = []
  let keyIdx = 0

  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s]+|10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]

    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={keyIdx++} className="px-1.5 py-0.5 rounded bg-pm-muted border border-pm-border font-mono text-[11px] text-pm-foreground font-semibold">
          {token.slice(1, -1)}
        </code>
      )
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={keyIdx++} className="font-bold text-pm-foreground">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={keyIdx++} className="italic text-pm-foreground/90">
          {token.slice(1, -1)}
        </em>
      )
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (linkMatch) {
        parts.push(
          <a
            key={keyIdx++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pm-accent underline hover:opacity-80 font-medium inline-flex items-center gap-0.5"
          >
            <span>{linkMatch[1]}</span>
            <ExternalLink className="w-2.5 h-2.5 inline" />
          </a>
        )
      }
    } else if (token.startsWith('http://') || token.startsWith('https://')) {
      parts.push(
        <a
          key={keyIdx++}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pm-accent underline hover:opacity-80 font-medium inline-flex items-center gap-0.5"
        >
          <span className="truncate max-w-[240px] inline-block align-bottom">{token}</span>
          <ExternalLink className="w-2.5 h-2.5 inline" />
        </a>
      )
    } else if (token.startsWith('10.')) {
      parts.push(
        <a
          key={keyIdx++}
          href={`https://doi.org/${token}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pm-accent underline hover:opacity-80 font-mono font-medium inline-flex items-center gap-0.5 text-[11px]"
        >
          <span>DOI: {token}</span>
          <ExternalLink className="w-2.5 h-2.5 inline" />
        </a>
      )
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

// ─── Markdown Blocks & Table Renderer ─────────────────────────────────────────
function MarkdownRenderer({ content }: { content: string }) {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null)

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code)
    setCopiedCodeIdx(idx)
    setTimeout(() => setCopiedCodeIdx(null), 2000)
  }

  const blocks = parseMarkdownBlocks(content)

  return (
    <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-pm-foreground">
      {blocks.map((block, bIdx) => {
        if (block.type === 'code') {
          return (
            <div key={bIdx} className="my-3 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 text-neutral-200 shadow-md">
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[11px] font-mono text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-pm-accent" />
                  <span>{block.lang || 'text'}</span>
                </div>
                <button type="button" onClick={() => handleCopyCode(block.code || '', bIdx)} className="flex items-center gap-1 hover:text-white transition-colors">
                  {copiedCodeIdx === bIdx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 text-[10px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 overflow-x-auto text-[11px] sm:text-xs font-mono leading-relaxed custom-scrollbar">
                <code>{block.code}</code>
              </pre>
            </div>
          )
        }

        if (block.type === 'table') {
          return (
            <div key={bIdx} className="my-3 overflow-x-auto rounded-xl border border-pm-border shadow-xs custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-pm-muted border-b border-pm-border">
                    {block.headers?.map((h, hIdx) => (
                      <th key={hIdx} className="px-3.5 py-2.5 font-bold text-pm-foreground whitespace-nowrap">
                        {formatInlineLinks(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-pm-border bg-pm-frame">
                  {block.rows?.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-pm-muted/50 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2 text-pm-foreground/90 leading-snug">
                          {formatInlineLinks(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        if (block.type === 'blockquote') {
          return (
            <div key={bIdx} className="my-2.5 pl-3.5 py-1 border-l-2 border-pm-accent bg-pm-accent/5 rounded-r-lg text-pm-foreground/90 italic">
              {formatInlineLinks(block.text || '')}
            </div>
          )
        }

        if (block.type === 'h2') {
          return (
            <h3 key={bIdx} className="text-sm sm:text-base font-bold text-pm-foreground mt-3 mb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pm-accent inline-block" />
              <span>{formatInlineLinks(block.text || '')}</span>
            </h3>
          )
        }

        if (block.type === 'bullet') {
          return (
            <div key={bIdx} className="flex items-start gap-2 pl-2">
              <span className="text-pm-accent font-bold mt-1 leading-none">•</span>
              <span className="flex-1">{formatInlineLinks(block.text || '')}</span>
            </div>
          )
        }

        if (block.type === 'numbered') {
          return (
            <div key={bIdx} className="flex items-start gap-2 pl-2">
              <span className="font-mono text-xs text-pm-accent font-bold mt-0.5">{block.num}.</span>
              <span className="flex-1">{formatInlineLinks(block.text || '')}</span>
            </div>
          )
        }

        return (
          <p key={bIdx} className="leading-relaxed">
            {formatInlineLinks(block.text || '')}
          </p>
        )
      })}
    </div>
  )
}

interface MarkdownBlock {
  type: 'code' | 'table' | 'h1' | 'h2' | 'h3' | 'bullet' | 'numbered' | 'blockquote' | 'paragraph'
  text?: string
  code?: string
  lang?: string
  headers?: string[]
  rows?: string[][]
  num?: string
}

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = []
  if (!markdown) return blocks

  const rawParts = markdown.split(/(```[\s\S]*?```)/g)

  for (const part of rawParts) {
    if (part.startsWith('```') && part.endsWith('```')) {
      const firstLineEnd = part.indexOf('\n')
      const lang = part.slice(3, firstLineEnd).trim() || 'text'
      const code = part.slice(firstLineEnd + 1, -3)
      blocks.push({ type: 'code', code, lang })
      continue
    }

    const lines = part.split('\n')
    let i = 0

    while (i < lines.length) {
      const line = lines[i]
      const trimmed = line.trim()

      if (!trimmed) {
        i++
        continue
      }

      if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < lines.length && lines[i + 1].trim().includes('---')) {
        const headers = trimmed
          .slice(1, -1)
          .split('|')
          .map((h) => h.trim())
        i += 2
        const rows: string[][] = []

        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          const cells = lines[i]
            .trim()
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim())
          rows.push(cells)
          i++
        }

        blocks.push({ type: 'table', headers, rows })
        continue
      }

      if (trimmed.startsWith('> ')) {
        blocks.push({ type: 'blockquote', text: trimmed.replace(/^>\s+/, '') })
        i++
        continue
      }

      if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
        blocks.push({ type: 'h2', text: trimmed.replace(/^#+\s+/, '') })
        i++
        continue
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        blocks.push({ type: 'bullet', text: trimmed.replace(/^[-*]\s+/, '') })
        i++
        continue
      }

      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
      if (numMatch) {
        blocks.push({ type: 'numbered', num: numMatch[1], text: numMatch[2] })
        i++
        continue
      }

      blocks.push({ type: 'paragraph', text: trimmed })
      i++
    }
  }

  return blocks
}

// ─── Main Two-Column Hub Content ──────────────────────────────────────────────
function ChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialAgentId = searchParams.get('agent') || 'planner'
  const [activeAgentId, setActiveAgentId] = useState<string>(initialAgentId)
  const [projectsList, setProjectsList] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  // Map messages per agent
  const [agentChats, setAgentChats] = useState<Record<string, Message[]>>({})
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isUserScrolledUpRef = useRef(false)

  const currentAgent = SCIENTIFIC_AGENTS.find((a) => a.id === activeAgentId) || SCIENTIFIC_AGENTS[0]
  const currentMessages = agentChats[activeAgentId] || []

  // Load Projects for Project Context Selector
  useEffect(() => {
    api.getProjects().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setProjectsList(data)
        setSelectedProjectId(data[0].id)
      }
    }).catch(() => {})
  }, [])

  // Sync activeAgent from URL and load persistent chat history from MongoDB
  useEffect(() => {
    const urlAgent = searchParams.get('agent')
    if (urlAgent && SCIENTIFIC_AGENTS.some((a) => a.id === urlAgent)) {
      setActiveAgentId(urlAgent)
    }
  }, [searchParams])

  // Fetch saved chat history for this agent from MongoDB database
  useEffect(() => {
    if (!agentChats[activeAgentId] || agentChats[activeAgentId].length === 0) {
      api.getAgentChatHistory(activeAgentId, selectedProjectId || undefined).then((history) => {
        if (Array.isArray(history) && history.length > 0) {
          const loaded: Message[] = history.map((h: any) => ({
            id: h.id,
            role: h.role,
            content: h.content,
            displayedContent: h.content,
            isWriting: false,
            timestamp: h.timestamp,
          }))
          setAgentChats((prev) => ({
            ...prev,
            [activeAgentId]: loaded,
          }))
        }
      }).catch(() => {})
    }
  }, [activeAgentId, selectedProjectId])

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
        project_id: selectedProjectId || undefined,
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
                content: 'Failed to communicate with specialized agent. Please verify your query and try again.',
                displayedContent: 'Failed to communicate with specialized agent. Please verify your query and try again.',
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
  const activeProjectObj = projectsList.find((p) => p.id === selectedProjectId)

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto h-[calc(100vh-4.5rem)] flex flex-col space-y-4 font-sans">
      {/* ── 1. HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pm-accent text-black uppercase tracking-wider">
              AGENT CO-PILOT HUB
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-pm-foreground">
            Specialized Scientific AI Agents
          </h1>
          <p className="text-xs text-pm-muted-foreground mt-0.5">
            Collaborate with specialized AI agents to plan, investigate, verify, critique, and synthesize research.
          </p>
        </div>

        {/* Right Status & Project Info */}
        <div className="flex items-center gap-4 self-start sm:self-auto shrink-0 bg-pm-frame border border-pm-border rounded-2xl px-4 py-2 shadow-xs">
          <div>
            <div className="text-[10px] font-mono text-pm-muted-foreground uppercase">Active Context</div>
            <div className="text-xs font-semibold text-pm-foreground truncate max-w-[180px]">
              {activeProjectObj?.topic || 'General Scientific Inquiry'}
            </div>
          </div>
          <div className="h-6 w-px bg-pm-border" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-right">
              <div className="text-[10px] font-mono text-pm-muted-foreground uppercase">Agent Activity</div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">All systems operational</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2-COLUMN MAIN WORKSPACE ── */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
        {/* ── LEFT SIDEBAR: RESEARCH TEAM (320px) ── */}
        <div className="w-full md:w-80 lg:w-88 flex flex-col justify-between shrink-0 gap-3 overflow-hidden">
          {/* Vertical Agent Cards List */}
          <div className="bg-pm-frame border border-pm-border rounded-3xl p-3 flex-1 flex flex-col shadow-xs overflow-hidden">
            <div className="px-3 py-2 text-xs font-bold text-pm-foreground uppercase tracking-wider font-mono flex items-center justify-between border-b border-pm-border mb-2">
              <span>RESEARCH TEAM</span>
              <span className="text-[10px] font-mono text-pm-muted-foreground font-semibold">6 AGENTS</span>
            </div>

            <div className="space-y-1.5 overflow-y-auto custom-scrollbar flex-1 pr-0.5">
              {SCIENTIFIC_AGENTS.map((agent) => {
                const Icon = agent.icon
                const isSelected = agent.id === activeAgentId

                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => {
                      setActiveAgentId(agent.id)
                      router.replace(`/dashboard/chat?agent=${agent.id}`, { scroll: false })
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between group select-none ${
                      isSelected
                        ? 'bg-pm-muted/90 border-pm-ring ring-1 ring-pm-ring shadow-sm'
                        : 'bg-pm-frame border-pm-border/80 hover:border-pm-ring/40 hover:bg-pm-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Number */}
                      <span className={`text-[11px] font-mono font-bold ${isSelected ? 'text-pm-accent font-extrabold' : 'text-pm-muted-foreground'}`}>
                        {agent.number}
                      </span>

                      {/* Icon */}
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105"
                        style={{ backgroundColor: agent.bgLight, color: agent.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Name & Specialization */}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-pm-foreground truncate">{agent.name}</div>
                        <div className="text-[11px] text-pm-muted-foreground truncate">{agent.specialization}</div>
                      </div>
                    </div>

                    {/* Online status indicator */}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: agent.color, boxShadow: isSelected ? `0 0 8px ${agent.color}` : 'none' }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* TEAM STATUS CARD */}
          <div className="bg-pm-frame border border-pm-border rounded-2xl p-3 shadow-xs shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-bold text-pm-muted-foreground uppercase">TEAM STATUS</div>
                <div className="text-xs font-semibold text-pm-foreground">All 6 agents online & ready</div>
              </div>
            </div>
            {/* 6 Green indicators */}
            <div className="flex items-center gap-1">
              {SCIENTIFIC_AGENTS.map((a) => (
                <span key={a.id} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: ACTIVE AGENT WORKSPACE (Flex-1) ── */}
        <div className="flex-1 bg-pm-frame border border-pm-border rounded-3xl flex flex-col shadow-xs overflow-hidden min-w-0">
          {/* Agent Header */}
          <div className="px-5 py-3.5 border-b border-pm-border bg-pm-frame/90 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                style={{ backgroundColor: currentAgent.bgLight, color: currentAgent.color }}
              >
                <AgentIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-pm-foreground tracking-tight truncate">
                    {currentAgent.name}
                  </span>
                  <span
                    className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0"
                    style={{ backgroundColor: currentAgent.bgLight, color: currentAgent.color }}
                  >
                    {currentAgent.badge}
                  </span>
                </div>
                <p className="text-[11px] text-pm-muted-foreground truncate max-w-md sm:max-w-xl mt-0.5">
                  {currentAgent.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => setShowInfoModal(!showInfoModal)}
                title="Agent Capabilities"
                className="p-2 rounded-xl text-pm-muted-foreground hover:text-pm-foreground hover:bg-pm-muted transition-colors"
              >
                <Info className="w-4 h-4" />
              </button>

              {currentMessages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="Clear Chat History"
                  className="p-2 rounded-xl text-pm-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Info Modal Accordion */}
          <AnimatePresence>
            {showInfoModal && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-pm-border bg-pm-muted/60 px-5 py-3 text-xs text-pm-foreground/90 space-y-1.5 shrink-0"
              >
                <div className="font-bold text-pm-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pm-accent" />
                  <span>ResearchGuard Agent Specification & Scope</span>
                </div>
                <p className="text-[11px] text-pm-muted-foreground leading-relaxed">
                  {currentAgent.description} All queries are restricted to empirical scientific methodologies, peer-reviewed literature citations, and statistical data.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Conversational Stream / Centered Empty State */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar bg-pm-background/20"
          >
            {currentMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5">
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg border border-pm-border"
                  style={{ backgroundColor: currentAgent.bgLight, color: currentAgent.color }}
                >
                  <AgentIcon className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-1.5">
                  <h3 className="text-base sm:text-lg font-bold text-pm-foreground">
                    Consult the {currentAgent.name}
                  </h3>
                  <p className="text-xs text-pm-muted-foreground leading-relaxed">
                    Ask a complex research question or choose from common research planning tasks below.
                  </p>
                </div>

                {/* 2x2 Prompt Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl mt-2">
                  {currentAgent.starterPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="p-3.5 rounded-2xl bg-pm-frame border border-pm-border hover:border-pm-ring/40 text-left text-xs font-medium text-pm-foreground hover:bg-pm-muted transition-all shadow-xs flex items-start gap-2.5 group"
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
                      <div className="max-w-[85%] sm:max-w-xl rounded-2xl rounded-tr-sm bg-pm-foreground text-pm-background p-3.5 sm:p-4 text-xs sm:text-sm font-medium shadow-xs leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  )
                }

                const displayText = msg.displayedContent || msg.content

                return (
                  <div key={msg.id} className="flex items-start gap-3 max-w-3xl">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-1"
                      style={{ backgroundColor: currentAgent.bgLight, color: currentAgent.color }}
                    >
                      <AgentIcon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="bg-pm-frame border border-pm-border rounded-2xl rounded-tl-sm p-4 sm:p-5 shadow-xs space-y-3">
                        {msg.error ? (
                          <div className="text-rose-500 text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{displayText}</span>
                          </div>
                        ) : (
                          <>
                            <MarkdownRenderer content={displayText} />
                            {msg.isWriting && (
                              <span className="inline-block w-2 h-4 bg-pm-accent animate-pulse align-middle ml-1" />
                            )}
                          </>
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

          {/* Scroll to bottom button */}
          <AnimatePresence>
            {showScrollBottom && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-24 right-8 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-pm-foreground text-pm-background shadow-lg text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <ArrowDown className="w-3 h-3" />
                <span>New response</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* ── CHAT COMPOSER ── */}
          <div className="p-3 sm:p-4 border-t border-pm-border bg-pm-frame/90 backdrop-blur-md shrink-0">
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="relative flex items-end gap-2 bg-pm-background border border-pm-border focus-within:border-pm-ring/60 focus-within:ring-2 focus-within:ring-pm-ring/20 rounded-2xl p-2 transition-all shadow-xs"
            >
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Ask the ${currentAgent.name} a question, request a matrix, or stress-test claims...`}
                rows={1}
                disabled={isThinking}
                className="flex-1 resize-none bg-transparent px-3 py-2 text-xs sm:text-sm text-pm-foreground placeholder:text-pm-muted-foreground focus:outline-none max-h-36 custom-scrollbar"
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || isThinking}
                className="w-9 h-9 rounded-xl bg-pm-foreground text-pm-background hover:bg-pm-foreground/90 disabled:opacity-30 flex items-center justify-center shrink-0 transition-all shadow-xs group"
              >
                <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-pm-muted-foreground px-2 mt-2">
              <span>Press Enter to send · Shift + Enter for new line</span>
              <span className="font-mono text-pm-muted-foreground/80">Restricted to peer-reviewed scientific scope</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AgentChatPage() {
  return (
    <Suspense fallback={<LuminarLoadingScreen message="Loading Research Command Center..." fullScreen={false} />}>
      <ChatContent />
    </Suspense>
  )
}
