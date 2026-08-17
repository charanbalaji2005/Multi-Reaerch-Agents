'use client'

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from 'react'
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
} from 'lucide-react'
import { AssistantAvatar, type AvatarState } from './AssistantAvatar'
import { api } from '@/lib/api'

interface SourceItem {
  id?: string
  title: string
  url?: string
  type?: string
  year?: string | number
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  displayedContent?: string
  isWriting?: boolean
  error?: boolean
  sources?: SourceItem[]
}

interface ResearchChatProps {
  projectId: string
  projectTopic?: string
  availableSources?: any[]
}

const QUICK_PROMPTS = [
  'Summarize the strongest evidence.',
  'Which claims are poorly supported?',
  'What are the main contradictions?',
  'What are the research limitations?',
]

// Custom lightweight markdown renderer for assistant responses
function MarkdownRenderer({ content }: { content: string }) {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null)

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code)
    setCopiedCodeIdx(idx)
    setTimeout(() => setCopiedCodeIdx(null), 2000)
  }

  // Split by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-pm-foreground">
      {parts.map((part, partIdx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineEnd = part.indexOf('\n')
          const lang = part.slice(3, firstLineEnd).trim() || 'text'
          const code = part.slice(firstLineEnd + 1, -3)

          return (
            <div
              key={partIdx}
              className="my-3 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 text-neutral-200 shadow-md"
            >
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[11px] font-mono text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-pm-accent" />
                  <span>{lang}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(code, partIdx)}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  {copiedCodeIdx === partIdx ? (
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
                <code>{code}</code>
              </pre>
            </div>
          )
        }

        // Process markdown lines
        const lines = part.split('\n')
        return (
          <div key={partIdx} className="space-y-2">
            {lines.map((line, lineIdx) => {
              const trimmed = line.trim()
              if (!trimmed) return <div key={lineIdx} className="h-1" />

              // H3
              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={lineIdx} className="text-sm sm:text-base font-bold text-pm-foreground mt-3 mb-1">
                    {formatInline(trimmed.replace('### ', ''))}
                  </h4>
                )
              }
              // H2
              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={lineIdx} className="text-base sm:text-lg font-bold text-pm-foreground mt-4 mb-1">
                    {formatInline(trimmed.replace('## ', ''))}
                  </h3>
                )
              }
              // H1
              if (trimmed.startsWith('# ')) {
                return (
                  <h2 key={lineIdx} className="text-lg sm:text-xl font-bold text-pm-foreground mt-4 mb-2">
                    {formatInline(trimmed.replace('# ', ''))}
                  </h2>
                )
              }
              // Bullet list
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-2">
                    <span className="text-pm-accent font-bold mt-1 leading-none">•</span>
                    <span className="flex-1">{formatInline(trimmed.replace(/^[-*]\s+/, ''))}</span>
                  </div>
                )
              }
              // Numbered list
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
              if (numMatch) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-2">
                    <span className="font-mono text-xs text-pm-accent font-bold mt-0.5">{numMatch[1]}.</span>
                    <span className="flex-1">{formatInline(numMatch[2])}</span>
                  </div>
                )
              }

              // Standard paragraph
              return <p key={lineIdx}>{formatInline(trimmed)}</p>
            })}
          </div>
        )
      })}
    </div>
  )
}

function formatInline(text: string) {
  // Replace bold, italic, inline code, and links
  const parts: (string | JSX.Element)[] = []
  let keyIdx = 0

  // Regex matches `code`, **bold**, *italic*, [link](url)
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

export function ResearchChat({ projectId, projectTopic, availableSources = [] }: ResearchChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingStep, setThinkingStep] = useState<'analyzing' | 'writing' | null>(null)
  const [isWriting, setIsWriting] = useState(false)
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isUserScrolledUpRef = useRef(false)
  const lastUserPromptRef = useRef<string>('')

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

  // Check scroll position
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

  // Progressive response typewriter
  const revealResponseProgressively = useCallback((messageId: string, fullText: string, sources: SourceItem[] = []) => {
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current)
    }

    setThinkingStep('writing')
    setIsWriting(true)

    // Tokenize into words with preserved spaces
    const words = fullText.match(/\S+|\s+/g) || [fullText]
    let currentIdx = 0
    let accumulated = ''

    animationTimerRef.current = setInterval(() => {
      if (currentIdx < words.length) {
        // Append 1-2 words per tick (25ms) for snappy response
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
        // Complete
        if (animationTimerRef.current) {
          clearInterval(animationTimerRef.current)
          animationTimerRef.current = null
        }
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, displayedContent: fullText, isWriting: false, sources }
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
    }, 28)
  }, [scrollToBottom])

  // Send message
  const handleSendMessage = async (promptText?: string) => {
    const textToSend = (promptText || inputValue).trim()
    if (!textToSend || isThinking || isWriting) return

    lastUserPromptRef.current = textToSend

    // 1. Immediately display user message
    const userMsgId = `user-${Date.now()}`
    const assistantMsgId = `assistant-${Date.now()}`

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
    }

    setMessages((prev) => [...prev, userMessage, placeholderAssistant])
    setInputValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    setIsThinking(true)
    setThinkingStep('analyzing')
    isUserScrolledUpRef.current = false
    setShowScrollBottom(false)
    setTimeout(() => scrollToBottom(true), 50)

    try {
      // Call backend API
      const res = await api.chat(projectId, textToSend)
      const answer = res?.answer || res?.data?.answer || res || 'No response returned from research engine.'

      // Extract real sources if available
      const realSources: SourceItem[] = (availableSources || [])
        .slice(0, 3)
        .map((s) => ({
          id: s.source_id,
          title: s.title || 'Peer-Reviewed Source',
          url: s.url,
          type: s.source_type || 'PubMed / arXiv',
          year: s.year || 2024,
        }))

      // Transition smoothly to progressive reveal
      revealResponseProgressively(assistantMsgId, answer, realSources)
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

  // Stop generation
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

  // Retry / Regenerate
  const handleRegenerate = () => {
    if (lastUserPromptRef.current) {
      handleSendMessage(lastUserPromptRef.current)
    }
  }

  // Copy message
  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMsgId(msgId)
    setTimeout(() => setCopiedMsgId(null), 2000)
  }

  // Keyboard handler
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }

  return (
    <div className="bg-pm-frame border border-pm-border rounded-3xl flex flex-col h-[640px] max-w-4xl mx-auto shadow-sm overflow-hidden relative">
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
                Live Copilot
              </span>
            </div>
            <p className="text-[10px] text-pm-muted-foreground truncate max-w-[240px] sm:max-w-md mt-0.5">
              {projectTopic || 'Grounded on peer-reviewed literature and empirical claims'}
            </p>
          </div>
        </div>

        {isWriting && (
          <button
            type="button"
            onClick={handleStopGeneration}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-colors"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop</span>
          </button>
        )}
      </div>

      {/* ── MESSAGES CONTAINER ── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar bg-pm-background/30"
      >
        {/* Empty State */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8 max-w-md mx-auto my-auto">
            <AssistantAvatar state="idle" size="lg" className="mb-4 shadow-md" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-pm-muted-foreground uppercase mb-1">
              ✦ RESEARCHGUARD AI
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-pm-foreground tracking-tight mb-2">
              Ask a question about this project
            </h3>
            <p className="text-xs text-pm-muted-foreground mb-6 leading-relaxed">
              Inquire about verified findings, claim grounding, sample sizes, and adversarial critic flags.
            </p>

            {/* Quick Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="text-left text-xs p-3 rounded-2xl bg-pm-frame border border-pm-border hover:border-pm-ring/40 text-pm-foreground/90 hover:text-pm-foreground transition-all shadow-sm group flex items-center justify-between"
                >
                  <span className="line-clamp-2">{prompt}</span>
                  <Send className="w-3 h-3 text-pm-muted-foreground group-hover:text-pm-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1.5" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message List */}
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user'
          const isLastAssistant = !isUser && idx === messages.length - 1

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <AssistantAvatar
                  state={msg.isWriting ? 'writing' : 'complete'}
                  size="sm"
                  className="mt-1"
                />
              )}

              <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Message Bubble */}
                <div
                  className={`rounded-2xl p-4 sm:p-5 shadow-sm ${
                    isUser
                      ? 'bg-pm-foreground text-pm-background rounded-tr-none text-xs sm:text-sm font-medium'
                      : 'bg-pm-frame border border-pm-border text-pm-foreground rounded-tl-none'
                  }`}
                >
                  {/* Thinking Status Indicator */}
                  {!isUser && isThinking && isLastAssistant && msg.isWriting && !msg.displayedContent && (
                    <div className="flex flex-col gap-2 py-1">
                      <div className="flex items-center gap-2 text-xs font-mono font-semibold text-pm-foreground">
                        <Sparkles className="w-3.5 h-3.5 text-pm-accent animate-spin" />
                        <span>✦ ResearchGuard AI</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-pm-muted-foreground font-mono">
                        <span>
                          {thinkingStep === 'analyzing'
                            ? 'Analyzing research context...'
                            : 'Writing response...'}
                        </span>
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-pm-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-pm-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-pm-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {msg.error && (
                    <div className="space-y-3 py-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-500 font-mono">
                        <AlertCircle className="w-4 h-4" />
                        <span>✦ ResearchGuard AI — Error</span>
                      </div>
                      <p className="text-xs text-pm-muted-foreground leading-relaxed">
                        Unable to complete the response. The research service did not return a valid answer.
                      </p>
                      <button
                        type="button"
                        onClick={handleRegenerate}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-pm-foreground text-pm-background text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Try Again</span>
                      </button>
                    </div>
                  )}

                  {/* Render Assistant or User Content */}
                  {!msg.error && (msg.displayedContent || msg.content) && (
                    <div className="relative">
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      ) : (
                        <div>
                          <MarkdownRenderer content={msg.displayedContent || msg.content} />
                          {/* Blinking Cursor during generation */}
                          {msg.isWriting && (
                            <span className="inline-block w-2 h-4 bg-pm-accent ml-1 animate-pulse align-middle" />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Real Source Chips */}
                  {!isUser && msg.sources && msg.sources.length > 0 && !msg.isWriting && (
                    <div className="mt-4 pt-3 border-t border-pm-border">
                      <span className="text-[10px] font-mono uppercase font-bold text-pm-muted-foreground tracking-wider block mb-2">
                        Referenced Sources
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((source, sIdx) => (
                          <a
                            key={sIdx}
                            href={source.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pm-muted border border-pm-border text-[11px] text-pm-foreground hover:border-pm-ring/50 transition-colors"
                          >
                            <BookOpen className="w-3 h-3 text-pm-accent shrink-0" />
                            <span className="truncate max-w-[180px]">{source.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-50 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Assistant Message Actions (Copy & Regenerate) */}
                {!isUser && !msg.isWriting && !msg.error && (msg.displayedContent || msg.content) && (
                  <div className="flex items-center gap-2 mt-1.5 pl-1 text-xs text-pm-muted-foreground">
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.displayedContent || msg.content)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-pm-muted hover:text-pm-foreground transition-colors"
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

                    {isLastAssistant && (
                      <button
                        type="button"
                        onClick={handleRegenerate}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-pm-muted hover:text-pm-foreground transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span className="text-[11px]">Regenerate</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── FLOATING SCROLL BOTTOM BUTTON ── */}
      <AnimatePresence>
        {showScrollBottom && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            type="button"
            onClick={() => {
              isUserScrolledUpRef.current = false
              scrollToBottom(true)
            }}
            className="absolute bottom-20 right-6 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-pm-foreground text-pm-background shadow-lg text-xs font-semibold hover:opacity-90 transition-all"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>↓ New response</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── INPUT COMPOSER ── */}
      <div className="p-3 sm:p-4 border-t border-pm-border bg-pm-frame/95 backdrop-blur-md shrink-0">
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="relative flex items-end gap-2 bg-pm-background border border-pm-border focus-within:border-pm-ring/50 focus-within:ring-1 focus-within:ring-pm-ring/50 rounded-2xl p-2 transition-all"
        >
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about empirical evidence, methodology, or citations..."
            rows={1}
            disabled={isThinking || isWriting}
            className="flex-1 bg-transparent text-xs sm:text-sm text-pm-foreground placeholder:text-pm-muted-foreground resize-none focus:outline-none max-h-40 px-2 py-1 leading-relaxed custom-scrollbar disabled:opacity-50"
          />

          <div className="flex items-center gap-1.5 shrink-0">
            {isWriting ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputValue.trim() || isThinking}
                className="w-8 h-8 rounded-xl bg-pm-accent disabled:opacity-30 disabled:cursor-not-allowed text-black flex items-center justify-center hover:bg-pm-accent/90 transition-all shadow-sm"
                title="Send query"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-pm-muted-foreground font-mono">
          <span>Press Enter to send • Shift + Enter for newline</span>
          <span className="hidden sm:inline">Grounded on Llama-3.3-70B & Multi-Agent Protocol</span>
        </div>
      </div>
    </div>
  )
}
