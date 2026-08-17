'use client'

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Square,
  Copy,
  Check,
  RefreshCw,
  ArrowDown,
  ExternalLink,
  AlertCircle,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Dna,
  Terminal,
  ChevronDown,
  ChevronUp,
  Search,
  Layers,
  FileText,
} from 'lucide-react'
import { AssistantAvatar } from './AssistantAvatar'
import { api } from '@/lib/api'

interface SourceItem {
  id?: string
  title: string
  url?: string
  type?: string
  year?: string | number
  doi?: string
  platform?: string
  quality?: number
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  displayedContent?: string
  isWriting?: boolean
  error?: boolean
  parentPrompt?: string
  citedSources?: SourceItem[]
}

interface ResearchChatProps {
  projectId: string
  projectTopic?: string
  availableSources?: any[]
}

const QUICK_PROMPTS = [
  'Summarize the strongest empirical evidence.',
  'Which claims have conflicting findings?',
  'What are the sample sizes and methodology limitations?',
  'Format the key study endpoints in a comparison table.',
]

// ─── Extract verified citations explicitly present in answer text ──────────────
function extractExplicitCitations(text: string, availableSources: any[] = []): SourceItem[] {
  if (!text || !availableSources.length) return []
  const cited: SourceItem[] = []
  const textLower = text.toLowerCase()

  for (const s of availableSources) {
    const title = s.title || ''
    const doi = s.doi || ''
    const sourceId = s.source_id || ''

    let isMatch = false

    // 1. Explicit DOI match
    if (doi && textLower.includes(doi.toLowerCase())) {
      isMatch = true
    }
    // 2. Explicit Source ID match (e.g. SRC_01, [SRC_01], src_01)
    else if (sourceId && (text.includes(sourceId) || textLower.includes(sourceId.toLowerCase()))) {
      isMatch = true
    }
    // 3. Significant title phrase match (> 15 chars)
    else if (title.length > 15) {
      const cleanTitle = title.toLowerCase().replace(/[^\w\s]/g, '')
      const titleWords = cleanTitle.split(/\s+/).filter((w: string) => w.length > 4)
      if (titleWords.length >= 3) {
        const matchCount = titleWords.filter((w: string) => textLower.includes(w)).length
        if (matchCount >= 3 && matchCount / titleWords.length >= 0.7) {
          isMatch = true
        }
      }
    }

    if (isMatch && !cited.some((c) => c.title === title)) {
      cited.push({
        id: s.source_id,
        title: s.title || 'Peer-Reviewed Source',
        url: s.url,
        type: s.source_type || 'Academic Publication',
        year: s.year || 2024,
        doi: s.doi,
        platform: s.source_platform || 'Crossref / PubMed',
        quality: s.quality_score,
      })
    }
  }

  return cited.slice(0, 5)
}

// ─── Full Markdown & Table Renderer ──────────────────────────────────────────
function MarkdownRenderer({ content }: { content: string }) {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null)

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code)
    setCopiedCodeIdx(idx)
    setTimeout(() => setCopiedCodeIdx(null), 2000)
  }

  // Parse markdown into blocks: code blocks, tables, lists, blockquotes, paragraphs
  const blocks = parseMarkdownBlocks(content)

  return (
    <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-pm-foreground">
      {blocks.map((block, bIdx) => {
        if (block.type === 'code') {
          return (
            <div
              key={bIdx}
              className="my-3 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 text-neutral-200 shadow-md"
            >
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[11px] font-mono text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-pm-accent" />
                  <span>{block.lang || 'text'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(block.code || '', bIdx)}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
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
            <div key={bIdx} className="my-3 overflow-x-auto rounded-xl border border-pm-border shadow-sm custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-pm-muted border-b border-pm-border">
                    {block.headers?.map((h, hIdx) => (
                      <th key={hIdx} className="px-3.5 py-2.5 font-bold text-pm-foreground whitespace-nowrap">
                        {formatInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-pm-border bg-pm-frame">
                  {block.rows?.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-pm-muted/50 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2 text-pm-foreground/90 leading-snug">
                          {formatInline(cell)}
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
            <div
              key={bIdx}
              className="my-2.5 pl-3.5 py-1 border-l-2 border-pm-accent bg-pm-accent/5 rounded-r-lg text-pm-foreground/90 italic"
            >
              {formatInline(block.text || '')}
            </div>
          )
        }

        if (block.type === 'h1') {
          return (
            <h2 key={bIdx} className="text-base sm:text-lg font-bold text-pm-foreground mt-4 mb-2">
              {formatInline(block.text || '')}
            </h2>
          )
        }

        if (block.type === 'h2') {
          return (
            <h3 key={bIdx} className="text-sm sm:text-base font-bold text-pm-foreground mt-3 mb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pm-accent inline-block" />
              <span>{formatInline(block.text || '')}</span>
            </h3>
          )
        }

        if (block.type === 'h3') {
          return (
            <h4 key={bIdx} className="text-xs sm:text-sm font-bold text-pm-foreground mt-2.5 mb-1">
              {formatInline(block.text || '')}
            </h4>
          )
        }

        if (block.type === 'bullet') {
          return (
            <div key={bIdx} className="flex items-start gap-2 pl-2">
              <span className="text-pm-accent font-bold mt-1 leading-none">•</span>
              <span className="flex-1">{formatInline(block.text || '')}</span>
            </div>
          )
        }

        if (block.type === 'numbered') {
          return (
            <div key={bIdx} className="flex items-start gap-2 pl-2">
              <span className="font-mono text-xs text-pm-accent font-bold mt-0.5">{block.num}.</span>
              <span className="flex-1">{formatInline(block.text || '')}</span>
            </div>
          )
        }

        // Paragraph
        return (
          <p key={bIdx} className="leading-relaxed">
            {formatInline(block.text || '')}
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

  // Split by code blocks first
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

      // Check for Markdown Table: line contains '|' and next line is separator '|---|'
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < lines.length && lines[i + 1].trim().includes('---')) {
        const headers = trimmed
          .slice(1, -1)
          .split('|')
          .map((h) => h.trim())
        i += 2 // Skip header & separator
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

      // Blockquotes
      if (trimmed.startsWith('> ')) {
        blocks.push({ type: 'blockquote', text: trimmed.replace(/^>\s+/, '') })
        i++
        continue
      }

      // Headings
      if (trimmed.startsWith('# ')) {
        blocks.push({ type: 'h1', text: trimmed.replace(/^#\s+/, '') })
        i++
        continue
      }
      if (trimmed.startsWith('## ')) {
        blocks.push({ type: 'h2', text: trimmed.replace(/^##\s+/, '') })
        i++
        continue
      }
      if (trimmed.startsWith('### ')) {
        blocks.push({ type: 'h3', text: trimmed.replace(/^###\s+/, '') })
        i++
        continue
      }

      // Bullet lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        blocks.push({ type: 'bullet', text: trimmed.replace(/^[-*]\s+/, '') })
        i++
        continue
      }

      // Numbered lists
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
      if (numMatch) {
        blocks.push({ type: 'numbered', num: numMatch[1], text: numMatch[2] })
        i++
        continue
      }

      // Standard paragraph
      blocks.push({ type: 'paragraph', text: trimmed })
      i++
    }
  }

  return blocks
}

function formatInline(text: string): ReactNode {
  if (!text) return ''
  const parts: (string | JSX.Element)[] = []
  let keyIdx = 0

  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={keyIdx++}
          className="px-1.5 py-0.5 rounded bg-pm-muted border border-pm-border font-mono text-[11px] text-pm-foreground font-semibold"
        >
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
            <ExternalLink className="w-3 h-3 inline" />
          </a>
        )
      }
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

// ─── ResearchChat Component ──────────────────────────────────────────────────
export function ResearchChat({ projectId, projectTopic, availableSources = [] }: ResearchChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingStep, setThinkingStep] = useState<'analyzing' | 'writing' | null>(null)
  const [isWriting, setIsWriting] = useState(false)
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const [showProjectSourcesDrawer, setShowProjectSourcesDrawer] = useState(false)
  const [sourceSearchQuery, setSourceSearchQuery] = useState('')

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isUserScrolledUpRef = useRef(false)

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current)
      }
    }
  }, [])

  // Auto-scroll handler
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

  // Progressive typewriter reveal
  const revealResponseProgressively = useCallback(
    (messageId: string, fullText: string, citedSources: SourceItem[] = []) => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current)
      }

      setThinkingStep('writing')
      setIsWriting(true)

      const words = fullText.match(/\S+|\s+/g) || [fullText]
      let currentIdx = 0
      let accumulated = ''

      animationTimerRef.current = setInterval(() => {
        if (currentIdx < words.length) {
          const chunk = words.slice(currentIdx, currentIdx + 2).join('')
          accumulated += chunk
          currentIdx += 2

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, displayedContent: accumulated, isWriting: true }
                : msg
            )
          )

          if (!isUserScrolledUpRef.current) {
            scrollToBottom(true)
          }
        } else {
          if (animationTimerRef.current) {
            clearInterval(animationTimerRef.current)
            animationTimerRef.current = null
          }
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, displayedContent: fullText, isWriting: false, citedSources }
                : msg
            )
          )
          setIsWriting(false)
          setIsThinking(false)
          setThinkingStep(null)
          if (!isUserScrolledUpRef.current) {
            scrollToBottom(true)
          }
        }
      }, 25)
    },
    [scrollToBottom]
  )

  // Send message
  const handleSendMessage = async (promptText?: string, targetAssistantMsgId?: string) => {
    const textToSend = (promptText || inputValue).trim()
    if (!textToSend || isThinking || isWriting) return

    const userMsgId = `user-${Date.now()}`
    const assistantMsgId = targetAssistantMsgId || `assistant-${Date.now()}`

    if (!targetAssistantMsgId) {
      // Normal new message
      const userMessage: Message = {
        id: userMsgId,
        role: 'user',
        content: textToSend,
      }

      const placeholderAssistant: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        displayedContent: '',
        isWriting: true,
        parentPrompt: textToSend,
      }

      setMessages((prev) => [...prev, userMessage, placeholderAssistant])
      setInputValue('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } else {
      // Regenerating existing assistant message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: '', displayedContent: '', isWriting: true, error: false }
            : msg
        )
      )
    }

    setIsThinking(true)
    setThinkingStep('analyzing')
    isUserScrolledUpRef.current = false
    setShowScrollBottom(false)
    setTimeout(() => scrollToBottom(true), 50)

    try {
      const res = await api.chat(projectId, textToSend)
      const answer = res?.answer || res?.data?.answer || res || 'No response returned from research engine.'

      // Extract ONLY genuinely cited sources from the answer text
      const citedSources = extractExplicitCitations(answer, availableSources)

      revealResponseProgressively(assistantMsgId, answer, citedSources)
    } catch (err: any) {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current)
        animationTimerRef.current = null
      }
      setIsThinking(false)
      setIsWriting(false)
      setThinkingStep(null)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                error: true,
                isWriting: false,
                content: 'Unable to complete the response. The research service did not return a valid answer.',
                displayedContent: 'Unable to complete the response. The research service did not return a valid answer.',
              }
            : msg
        )
      )
    }
  }

  const handleStopGeneration = () => {
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current)
      animationTimerRef.current = null
    }
    setIsWriting(false)
    setIsThinking(false)
    setThinkingStep(null)
    setMessages((prev) =>
      prev.map((msg) => (msg.isWriting ? { ...msg, isWriting: false } : msg))
    )
  }

  // Regenerate specific message using its parentPrompt
  const handleRegenerateMessage = (msg: Message) => {
    if (msg.parentPrompt) {
      handleSendMessage(msg.parentPrompt, msg.id)
    }
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

  const filteredProjectSources = availableSources.filter((s) => {
    if (!sourceSearchQuery) return true
    const q = sourceSearchQuery.toLowerCase()
    return (s.title || '').toLowerCase().includes(q) || (s.source_platform || '').toLowerCase().includes(q)
  })

  return (
    <div className="bg-pm-frame border border-pm-border rounded-3xl flex flex-col h-[680px] max-w-4xl mx-auto shadow-sm overflow-hidden relative">
      {/* ── HEADER ── */}
      <div className="px-5 py-3.5 border-b border-pm-border bg-pm-frame/90 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <AssistantAvatar state={isThinking ? (thinkingStep === 'analyzing' ? 'thinking' : 'writing') : 'idle'} size="sm" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-pm-foreground tracking-tight leading-none">
                ResearchGuard AI Assistant
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-pm-accent text-black font-semibold uppercase">
                Grounded Co-Pilot
              </span>
            </div>
            <p className="text-[10px] text-pm-muted-foreground truncate max-w-[200px] sm:max-w-md mt-0.5">
              {projectTopic || 'Grounded on peer-reviewed literature and empirical claims'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowProjectSourcesDrawer(!showProjectSourcesDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-pm-border bg-pm-muted text-xs font-semibold text-pm-muted-foreground hover:text-pm-foreground transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-pm-accent" />
            <span>Project Sources ({availableSources.length})</span>
            {showProjectSourcesDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {isWriting && (
            <button
              type="button"
              onClick={handleStopGeneration}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-colors"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* ── COLLAPSIBLE PROJECT SOURCES DRAWER (Option B: Separated from answer citations) ── */}
      <AnimatePresence>
        {showProjectSourcesDrawer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-b border-pm-border bg-pm-muted/60 px-5 py-3 overflow-hidden shrink-0"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-pm-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-pm-accent" />
                <span>All Indexed Research Sources ({availableSources.length})</span>
              </div>
              <div className="relative w-48">
                <Search className="w-3 h-3 text-pm-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter sources..."
                  value={sourceSearchQuery}
                  onChange={(e) => setSourceSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-[11px] rounded-lg bg-pm-frame border border-pm-border text-pm-foreground focus:outline-none focus:ring-1 focus:ring-pm-ring"
                />
              </div>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              {filteredProjectSources.length === 0 ? (
                <p className="text-[11px] text-pm-muted-foreground italic py-2">No sources matching filter.</p>
              ) : (
                filteredProjectSources.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-pm-frame border border-pm-border text-xs"
                  >
                    <div className="flex-1 truncate mr-2">
                      <span className="font-semibold text-pm-foreground">{s.title || 'Untitled Source'}</span>
                      <span className="text-[10px] text-pm-muted-foreground ml-2">
                        {s.year || 2024} · {s.source_platform || s.venue || 'Academic'}
                      </span>
                    </div>
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-pm-accent hover:opacity-80 flex items-center gap-1 shrink-0 text-[10px] font-mono font-semibold"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MESSAGES CONTAINER ── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar bg-pm-background/30"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-pm-muted border border-pm-border flex items-center justify-center text-pm-foreground shadow-sm">
              <Sparkles className="w-6 h-6 text-pm-accent" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="text-base font-bold text-pm-foreground">Ask ResearchGuard Co-Pilot</h3>
              <p className="text-xs text-pm-muted-foreground leading-relaxed">
                Interrogate evidence, compare study results in tables, audit citation grounding, and inspect
                methodological constraints.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg mt-2">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="p-3 rounded-2xl bg-pm-frame border border-pm-border hover:border-pm-ring/40 text-left text-xs font-medium text-pm-foreground hover:bg-pm-muted transition-all duration-200 shadow-sm flex items-start gap-2 group"
                >
                  <Dna className="w-3.5 h-3.5 text-pm-accent shrink-0 mt-0.5 transition-transform group-hover:scale-110" />
                  <span className="line-clamp-2">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-xl rounded-2xl rounded-tr-sm bg-pm-foreground text-pm-background p-3.5 sm:p-4 text-xs sm:text-sm font-medium shadow-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              )
            }

            // Assistant Message
            const displayText = msg.displayedContent || msg.content

            return (
              <div key={msg.id} className="flex items-start gap-3 max-w-3xl">
                <AssistantAvatar
                  state={msg.isWriting ? 'writing' : msg.error ? 'idle' : 'complete'}
                  size="md"
                />

                <div className="flex-1 space-y-3">
                  <div className="bg-pm-frame border border-pm-border rounded-2xl rounded-tl-sm p-4 sm:p-5 shadow-sm space-y-3">
                    {msg.error ? (
                      <div className="flex items-start gap-2.5 text-rose-500 dark:text-rose-400 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-2">
                          <p>{displayText}</p>
                          <button
                            type="button"
                            onClick={() => handleRegenerateMessage(msg)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-semibold hover:bg-rose-500/20 transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Try Again</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <MarkdownRenderer content={displayText} />

                        {msg.isWriting && (
                          <span className="inline-block w-2 h-4 bg-pm-accent animate-pulse align-middle ml-1" />
                        )}
                      </>
                    )}

                    {/* Sources cited strictly in this answer */}
                    {!msg.isWriting && msg.citedSources && msg.citedSources.length > 0 && (
                      <div className="pt-3 border-t border-pm-border/80 space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-bold text-pm-muted-foreground tracking-wider">
                          <ShieldCheck className="w-3.5 h-3.5 text-pm-accent" />
                          <span>Sources Cited In This Answer ({msg.citedSources.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.citedSources.map((source, sIdx) => (
                            <a
                              key={sIdx}
                              href={source.url || '#'}
                              target={source.url ? '_blank' : '_self'}
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pm-muted border border-pm-border hover:border-pm-ring/40 text-[11px] text-pm-foreground font-medium transition-all group"
                            >
                              <BookOpen className="w-3 h-3 text-pm-accent shrink-0" />
                              <span className="truncate max-w-[200px]">{source.title}</span>
                              <span className="text-[9px] font-mono text-pm-muted-foreground">({source.year || 2024})</span>
                              {source.url && (
                                <ExternalLink className="w-2.5 h-2.5 text-pm-muted-foreground group-hover:text-pm-foreground" />
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Action Bar */}
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
                          onClick={() => handleRegenerateMessage(msg)}
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

      {/* ── SCROLL TO BOTTOM BUTTON ── */}
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
            <span>New response</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── INPUT BAR ── */}
      <div className="p-3 sm:p-4 border-t border-pm-border bg-pm-frame/90 backdrop-blur-md">
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
            placeholder="Ask a scientific question, audit evidence, or request table comparisons..."
            rows={1}
            disabled={isThinking || isWriting}
            className="flex-1 resize-none bg-transparent px-2.5 py-1.5 text-xs sm:text-sm text-pm-foreground placeholder:text-pm-muted-foreground focus:outline-none max-h-36 custom-scrollbar"
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isThinking || isWriting}
            className="w-9 h-9 rounded-xl bg-pm-foreground text-pm-background hover:bg-pm-foreground/90 disabled:opacity-30 flex items-center justify-center shrink-0 transition-all shadow-sm group"
          >
            <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </form>
        <p className="text-[10px] text-pm-muted-foreground text-center mt-2">
          Evidence extracted directly from peer-reviewed databases. Always verify primary literature before clinical decisions.
        </p>
      </div>
    </div>
  )
}
