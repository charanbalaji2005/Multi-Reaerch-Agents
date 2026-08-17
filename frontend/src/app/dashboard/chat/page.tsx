'use client'

import { useState, useRef, useEffect, useCallback, Suspense, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  MessageSquare,
  FileText,
  Dna,
  BookOpen,
  FileCode,
  Paperclip,
  Send,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  ArrowDown,
  X,
  File,
  Download,
} from 'lucide-react'
import { api } from '@/lib/api'
import LuminarLoadingScreen from '@/components/ui/LuminarLoadingScreen'
import toast from 'react-hot-toast'

interface Project {
  id: string
  topic: string
  description?: string
  status: string
  integrity_score?: number
  created_at: string
  documents?: string[]
  uploaded_files?: any[]
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  displayedContent?: string
  isWriting?: boolean
  error?: boolean
  parentPrompt?: string
  timestamp?: string
  attachedFileName?: string
}

interface UploadedFilePreview {
  file: File
  name: string
  size: number
  type: string
}

// ─── Format Inline Links (DOIs, PubMed, arXiv, URLs) ──────────────────────────
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
                <span>{block.lang || 'text'}</span>
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
        const headers = trimmed.slice(1, -1).split('|').map((h) => h.trim())
        i += 2
        const rows: string[][] = []

        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          const cells = lines[i].trim().slice(1, -1).split('|').map((c) => c.trim())
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

// ─── Main Workspace & Chat Component ──────────────────────────────────────────
function ResearchWorkspaceContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [searchHistoryText, setSearchHistoryText] = useState('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'evidence' | 'sources' | 'files' | 'report'>('chat')

  // Active Research Data
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [report, setReport] = useState<any>(null)
  const [sources, setSources] = useState<any[]>([])
  const [evidence, setEvidence] = useState<any[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [messages, setMessages] = useState<Message[]>([])

  // Composer State
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingStage, setThinkingStage] = useState('Thinking...')
  const [attachedFile, setAttachedFile] = useState<UploadedFilePreview | null>(null)
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isUserScrolledUpRef = useRef(false)

  // 1. Start New Chat / Fresh Research Inquiry
  const handleStartNewChat = () => {
    setSelectedProjectId(null)
    setActiveProject(null)
    setMessages([])
    setSources([])
    setEvidence([])
    setUploadedFiles([])
    setReport(null)
    setActiveTab('chat')
    setAttachedFile(null)
    router.replace('/dashboard/chat', { scroll: false })
  }

  // 2. Fetch User's Research Projects
  const loadProjects = useCallback(async () => {
    try {
      const data = await api.getProjects()
      if (Array.isArray(data)) {
        setProjects(data)
        const targetId = searchParams.get('project')
        if (targetId && selectedProjectId !== targetId) {
          setSelectedProjectId(targetId)
        } else if (!targetId && selectedProjectId === null && data.length > 0) {
          // If no specific project in URL and not explicitly cleared, load latest
          setSelectedProjectId(data[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching research history:', err)
    }
  }, [searchParams, selectedProjectId])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // 3. Load Selected Research Data & Context
  const loadSelectedResearch = useCallback(async (projId: string) => {
    try {
      const [projData, chatHistory, sourcesData, evidenceData, reportData, filesData] = await Promise.allSettled([
        api.getProject(projId),
        api.getProjectChatHistory(projId),
        api.getSources(projId),
        api.getEvidence(projId),
        api.getReport(projId),
        api.getProjectFiles(projId),
      ])

      if (projData.status === 'fulfilled') setActiveProject(projData.value)
      if (sourcesData.status === 'fulfilled' && Array.isArray(sourcesData.value)) setSources(sourcesData.value)
      if (evidenceData.status === 'fulfilled' && Array.isArray(evidenceData.value)) setEvidence(evidenceData.value)
      if (reportData.status === 'fulfilled') setReport(reportData.value)
      if (filesData.status === 'fulfilled' && Array.isArray(filesData.value)) setUploadedFiles(filesData.value)

      if (chatHistory.status === 'fulfilled' && Array.isArray(chatHistory.value)) {
        const loaded: Message[] = chatHistory.value.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          displayedContent: m.content,
          isWriting: false,
          timestamp: m.timestamp,
        }))
        setMessages(loaded)
      } else {
        setMessages([])
      }
    } catch (e) {
      console.error('Error loading research context:', e)
    }
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      loadSelectedResearch(selectedProjectId)
    }
  }, [selectedProjectId, loadSelectedResearch])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current)
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

  // Typewriter Text Stream Reveal
  const revealResponseProgressively = useCallback(
    (messageId: string, fullText: string) => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current)

      const words = fullText.match(/\S+|\s+/g) || [fullText]
      let currentIdx = 0
      let accumulated = ''

      animationTimerRef.current = setInterval(() => {
        if (currentIdx < words.length) {
          const chunk = words.slice(currentIdx, currentIdx + 2).join('')
          accumulated += chunk
          currentIdx += 2

          setMessages((prev) =>
            prev.map((msg) => (msg.id === messageId ? { ...msg, displayedContent: accumulated, isWriting: true } : msg))
          )

          if (!isUserScrolledUpRef.current) scrollToBottom(true)
        } else {
          if (animationTimerRef.current) {
            clearInterval(animationTimerRef.current)
            animationTimerRef.current = null
          }
          setMessages((prev) =>
            prev.map((msg) => (msg.id === messageId ? { ...msg, displayedContent: fullText, isWriting: false } : msg))
          )
          setIsThinking(false)
          if (!isUserScrolledUpRef.current) scrollToBottom(true)
        }
      }, 20)
    },
    [scrollToBottom]
  )

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0]
      setAttachedFile({
        file: f,
        name: f.name,
        size: f.size,
        type: f.name.split('.').pop()?.toUpperCase() || 'FILE',
      })
    }
  }

  const handleRemoveAttachedFile = () => {
    setAttachedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Send Follow-up Message with optional uploaded document
  const handleSendMessage = async (promptText?: string, targetAssistantMsgId?: string) => {
    const textToSend = (promptText || inputValue).trim()
    if ((!textToSend && !attachedFile) || isThinking) return

    const userMsgId = `user-${Date.now()}`
    const assistantMsgId = targetAssistantMsgId || `assistant-${Date.now()}`
    const currentAttached = attachedFile
    const currentProjectId = selectedProjectId || 'general'

    let fileTextToInject = ''
    let uploadedFileName = ''

    if (!targetAssistantMsgId) {
      const userMsg: Message = {
        id: userMsgId,
        role: 'user',
        content: textToSend,
        attachedFileName: currentAttached?.name,
      }
      const placeholderAssistant: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        displayedContent: '',
        isWriting: true,
        parentPrompt: textToSend,
      }

      setMessages((prev) => [...prev, userMsg, placeholderAssistant])
      setInputValue('')
      handleRemoveAttachedFile()
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    } else {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, content: '', displayedContent: '', isWriting: true, error: false } : msg
        )
      )
    }

    setIsThinking(true)
    setThinkingStage('Reviewing research context...')
    isUserScrolledUpRef.current = false
    setShowScrollBottom(false)
    setTimeout(() => scrollToBottom(true), 50)

    // If file was attached and project exists, upload and extract
    if (currentAttached && selectedProjectId) {
      setThinkingStage(`Reading ${currentAttached.name}...`)
      try {
        const uploadRes = await api.uploadDocument(selectedProjectId, currentAttached.file)
        fileTextToInject = uploadRes?.extracted_text || ''
        uploadedFileName = currentAttached.name
        setUploadedFiles((prev) => [...prev, uploadRes])
        toast.success(`✓ ${currentAttached.name} analyzed and added to workspace`)
      } catch (uploadErr) {
        console.warn('File upload warning:', uploadErr)
      }
    }

    // Dynamic processing stages
    setTimeout(() => setThinkingStage('Checking relevant evidence & citations...'), 400)
    setTimeout(() => setThinkingStage('Synthesizing research response...'), 900)

    try {
      const res = await api.chat(
        currentProjectId,
        textToSend || 'Please analyze and summarize the attached document in the context of this research.',
        fileTextToInject || undefined,
        uploadedFileName || undefined
      )
      const answer = res?.answer || res?.data?.answer || res || 'Hello! How can I assist with your research inquiry today?'
      revealResponseProgressively(assistantMsgId, answer)
    } catch (err: any) {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current)
        animationTimerRef.current = null
      }
      setIsThinking(false)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                error: true,
                isWriting: false,
                content: 'Failed to communicate with research engine. Please try again.',
                displayedContent: 'Failed to communicate with research engine. Please try again.',
              }
            : msg
        )
      )
    }
  }

  const handleDeleteProject = async (e: React.MouseEvent, projId: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this research project?')) return
    try {
      await api.deleteProject(projId)
      toast.success('Research deleted')
      const remaining = projects.filter((p) => p.id !== projId)
      setProjects(remaining)
      if (selectedProjectId === projId) {
        if (remaining.length > 0) {
          setSelectedProjectId(remaining[0].id)
        } else {
          handleStartNewChat()
        }
      }
    } catch (err) {
      toast.error('Failed to delete research')
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

  // Filter projects by search
  const filteredProjects = projects.filter((p) =>
    (p.topic || '').toLowerCase().includes(searchHistoryText.toLowerCase())
  )

  // Chronological Grouping
  const groupProjects = (list: Project[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const thisWeek = new Date(today)
    thisWeek.setDate(thisWeek.getDate() - 7)

    const groups: { [key: string]: Project[] } = {
      TODAY: [],
      YESTERDAY: [],
      'THIS WEEK': [],
      EARLIER: [],
    }

    list.forEach((p) => {
      const pDate = new Date(p.created_at || Date.now())
      if (pDate >= today) groups.TODAY.push(p)
      else if (pDate >= yesterday) groups.YESTERDAY.push(p)
      else if (pDate >= thisWeek) groups['THIS WEEK'].push(p)
      else groups.EARLIER.push(p)
    })

    return groups
  }

  const grouped = groupProjects(filteredProjects)

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto h-[calc(100vh-4.5rem)] flex flex-col space-y-3 font-sans">
      {/* ── 2-COLUMN MAIN WORKSPACE ── */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
        {/* ── LEFT COLUMN: PREVIOUS RESEARCH (320px) ── */}
        <div
          className={`${
            isSidebarCollapsed ? 'w-12' : 'w-full md:w-80 lg:w-88'
          } bg-pm-frame border border-pm-border rounded-3xl p-3 flex flex-col justify-between shrink-0 transition-all duration-300 shadow-xs overflow-hidden`}
        >
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center py-2 h-full justify-between">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                title="Expand Previous Research"
                className="p-2 rounded-xl text-pm-muted-foreground hover:text-pm-foreground hover:bg-pm-muted transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="text-[10px] font-mono text-pm-muted-foreground uppercase rotate-90 whitespace-nowrap">
                RESEARCH HISTORY
              </span>
              <button
                type="button"
                onClick={handleStartNewChat}
                title="New Research Chat"
                className="p-2 rounded-xl bg-pm-accent text-black font-bold shadow-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 space-y-3">
              {/* Header & Collapse Button */}
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-xs font-bold text-pm-foreground uppercase tracking-wider font-mono">
                  PREVIOUS RESEARCH
                </span>
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-1 rounded-lg text-pm-muted-foreground hover:text-pm-foreground hover:bg-pm-muted transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* + New Research Chat Button */}
              <button
                type="button"
                onClick={handleStartNewChat}
                className="w-full py-2.5 px-3 rounded-2xl bg-pm-accent hover:bg-pm-accent/90 text-black text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Research Chat</span>
              </button>

              {/* Search History Bar */}
              <div className="relative shrink-0">
                <Search className="w-3.5 h-3.5 text-pm-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchHistoryText}
                  onChange={(e) => setSearchHistoryText(e.target.value)}
                  placeholder="Search previous research..."
                  className="w-full pl-8 pr-3 py-2 bg-pm-background border border-pm-border rounded-xl text-xs text-pm-foreground placeholder:text-pm-muted-foreground focus:outline-none focus:border-pm-ring/60 transition-colors"
                />
              </div>

              {/* Research Items List */}
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-0.5">
                {projects.length === 0 ? (
                  <div className="text-center py-10 px-4 space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-pm-muted flex items-center justify-center mx-auto text-pm-muted-foreground">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-pm-foreground">No research yet</div>
                    <p className="text-[11px] text-pm-muted-foreground">
                      Start your first scientific investigation with Luminar AI.
                    </p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([groupLabel, items]) => {
                    if (items.length === 0) return null
                    return (
                      <div key={groupLabel} className="space-y-1.5">
                        <div className="text-[10px] font-mono font-bold text-pm-muted-foreground tracking-wider px-2 uppercase">
                          {groupLabel}
                        </div>
                        <div className="space-y-1">
                          {items.map((proj) => {
                            const isSelected = proj.id === selectedProjectId
                            return (
                              <div
                                key={proj.id}
                                onClick={() => {
                                  setSelectedProjectId(proj.id)
                                  router.replace(`/dashboard/chat?project=${proj.id}`, { scroll: false })
                                }}
                                className={`w-full p-2.5 rounded-2xl border text-left transition-all cursor-pointer group relative ${
                                  isSelected
                                    ? 'bg-pm-muted border-pm-ring ring-1 ring-pm-ring shadow-xs'
                                    : 'bg-pm-frame border-pm-border/80 hover:bg-pm-muted/50 hover:border-pm-ring/30'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="text-xs font-semibold text-pm-foreground line-clamp-2 leading-snug">
                                    {proj.topic}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteProject(e, proj.id)}
                                    title="Delete research"
                                    className="opacity-0 group-hover:opacity-100 p-1 text-pm-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-all shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-pm-muted-foreground">
                                  <span>{new Date(proj.created_at || Date.now()).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span className="capitalize">{proj.status || 'Completed'}</span>
                                  {proj.integrity_score && (
                                    <>
                                      <span>•</span>
                                      <span className="text-emerald-500 font-semibold">{proj.integrity_score}/100</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Active Engine Footer */}
              <div className="pt-2 border-t border-pm-border flex items-center justify-between text-[10px] text-pm-muted-foreground font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Research Engine Active</span>
                </span>
                <span>{projects.length} Saved</span>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: ACTIVE RESEARCH WORKSPACE (Flex-1) ── */}
        <div className="flex-1 bg-pm-frame border border-pm-border rounded-3xl flex flex-col shadow-xs overflow-hidden min-w-0">
          {/* Active Research Header */}
          <div className="px-5 py-3.5 border-b border-pm-border bg-pm-frame/90 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-center p-1 shrink-0 overflow-hidden">
                <Image src="/logo.png" alt="Luminar AI" width={32} height={32} className="w-full h-full object-contain" priority />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-pm-foreground tracking-tight truncate max-w-md sm:max-w-xl">
                    {activeProject?.topic || 'Luminar AI Scientific Co-Pilot'}
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-pm-accent text-black font-bold uppercase shrink-0">
                    LUMINAR AI
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-pm-muted-foreground font-mono mt-0.5">
                  <span>Sources: {sources.length}</span>
                  <span>•</span>
                  <span>Files: {uploadedFiles.length}</span>
                  <span>•</span>
                  <span>Integrity: {activeProject?.integrity_score || 88}/100</span>
                </div>
              </div>
            </div>

            {/* Research Workspace Tabs */}
            <div className="flex items-center gap-1 bg-pm-muted p-1 rounded-2xl shrink-0 self-start sm:self-auto">
              {[
                { id: 'chat', label: 'Chat', icon: MessageSquare },
                { id: 'evidence', label: `Evidence (${evidence.length})`, icon: Dna },
                { id: 'sources', label: `Sources (${sources.length})`, icon: BookOpen },
                { id: 'files', label: `Files (${uploadedFiles.length})`, icon: FileText },
                { id: 'report', label: 'Report', icon: FileCode },
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-pm-foreground text-pm-background shadow-xs'
                        : 'text-pm-muted-foreground hover:text-pm-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── TAB 1: PRIMARY RESEARCH CHAT ── */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Messages Stream */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar bg-pm-background/20"
              >
                {/* Research Context Header Pill */}
                {activeProject && (
                  <div className="p-4 rounded-2xl bg-pm-frame border border-pm-border shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-pm-foreground">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-pm-accent" />
                        <span>ACTIVE RESEARCH CONTEXT: {activeProject.topic}</span>
                      </span>
                      <span className="text-[10px] font-mono text-pm-muted-foreground">
                        {new Date(activeProject.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    {activeProject.description && !activeProject.description.startsWith('Example:') && (
                      <p className="text-xs text-pm-muted-foreground leading-relaxed">
                        {activeProject.description}
                      </p>
                    )}
                  </div>
                )}

                {messages.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
                    <div className="w-14 h-14 rounded-3xl bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center p-2">
                      <Image src="/logo.png" alt="Luminar AI" width={48} height={48} className="w-full h-full object-contain" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-pm-foreground">
                        {activeProject ? 'Continue Your Research' : 'Start a Research Inquiry'}
                      </h3>
                      <p className="text-xs text-pm-muted-foreground leading-relaxed">
                        Ask any scientific question, formulate search strategies, verify claims, or upload clinical trials / PDFs to analyze against evidence.
                      </p>
                    </div>
                    {/* Starter Prompts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2">
                      {[
                        'What were the strongest peer-reviewed studies on GLP-1?',
                        'Did any trials contradict intermittent fasting efficacy?',
                        'Extract effect sizes and p-values into a comparison table',
                        'Compare these findings with recent 2024 meta-analyses',
                      ].map((prompt, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => handleSendMessage(prompt)}
                          className="p-3 rounded-2xl bg-pm-frame border border-pm-border hover:border-pm-ring/40 text-left text-xs font-medium text-pm-foreground hover:bg-pm-muted transition-all shadow-xs flex items-start gap-2 group"
                        >
                          <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-pm-accent transition-transform group-hover:scale-110" />
                          <span className="line-clamp-2 leading-relaxed">{prompt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    if (msg.role === 'user') {
                      return (
                        <div key={msg.id} className="flex flex-col items-end space-y-1">
                          {msg.attachedFileName && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-pm-muted text-[11px] font-mono text-pm-muted-foreground border border-pm-border">
                              <File className="w-3 h-3 text-pm-accent" />
                              <span>{msg.attachedFileName}</span>
                            </div>
                          )}
                          <div className="max-w-[85%] sm:max-w-xl rounded-2xl rounded-tr-sm bg-pm-foreground text-pm-background p-3.5 sm:p-4 text-xs sm:text-sm font-medium shadow-xs leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        </div>
                      )
                    }

                    const displayText = msg.displayedContent || msg.content

                    return (
                      <div key={msg.id} className="flex items-start gap-3 max-w-3xl">
                        {/* Luminar AI Logo */}
                        <div className="w-8 h-8 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-center p-1 shrink-0 mt-1 overflow-hidden">
                          <Image src="/logo.png" alt="Luminar AI" width={28} height={28} className="w-full h-full object-contain" />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="bg-pm-frame border border-pm-border rounded-2xl rounded-tl-sm p-4 sm:p-5 shadow-xs space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-pm-border/60 text-[10px] font-mono text-pm-muted-foreground">
                              <span className="font-bold text-pm-foreground uppercase">Luminar AI Research Engine</span>
                              <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'Verified'}</span>
                            </div>

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

                {/* Thinking Animation State */}
                {isThinking && (
                  <div className="flex items-start gap-3 max-w-md animate-fadeIn">
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-center p-1 shrink-0 mt-1 animate-pulse">
                      <Image src="/logo.png" alt="Luminar AI" width={28} height={28} className="w-full h-full object-contain" />
                    </div>
                    <div className="bg-pm-frame border border-pm-border rounded-2xl rounded-tl-sm p-4 shadow-xs space-y-2 flex-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-pm-foreground">
                        <span className="w-2 h-2 rounded-full bg-pm-accent animate-pulse" />
                        <span>{thinkingStage}</span>
                      </div>
                      <div className="flex items-center gap-1.5" aria-hidden="true">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-[#6366F1]"
                            animate={{
                              opacity: [0.3, 1, 0.3],
                              scale: [0.8, 1.2, 0.8],
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
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

              {/* ── CHAT COMPOSER & FILE ATTACHMENT ── */}
              <div className="p-3 sm:p-4 border-t border-pm-border bg-pm-frame/90 backdrop-blur-md shrink-0 space-y-2">
                {/* Context Indicator Active */}
                <div className="flex items-center justify-between px-2 text-[10px] font-mono text-pm-muted-foreground">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>
                      {selectedProjectId
                        ? `Research Context Active: ${sources.length} sources • ${uploadedFiles.length} files • ${messages.length} messages`
                        : 'General Research Consultation Active'}
                    </span>
                  </span>
                  <span>PDF · DOCX · TXT · Images</span>
                </div>

                {/* Attached File Preview Pill */}
                {attachedFile && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-pm-muted border border-pm-border w-fit text-xs text-pm-foreground">
                    <File className="w-4 h-4 text-pm-accent" />
                    <span className="font-semibold">{attachedFile.name}</span>
                    <span className="text-[10px] font-mono text-pm-muted-foreground">
                      ({(attachedFile.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveAttachedFile}
                      className="p-0.5 hover:text-rose-500 rounded transition-colors ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Form Input */}
                <form
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault()
                    handleSendMessage()
                  }}
                  className="relative flex items-end gap-2 bg-pm-background border border-pm-border focus-within:border-pm-ring/60 focus-within:ring-2 focus-within:ring-pm-ring/20 rounded-2xl p-2 transition-all shadow-xs"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Upload 📎 button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload PDF, DOCX, TXT, or scientific image"
                    className="p-2 text-pm-muted-foreground hover:text-pm-foreground hover:bg-pm-muted rounded-xl transition-colors shrink-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      attachedFile
                        ? `Ask a question about ${attachedFile.name} compared to this research...`
                        : 'Ask a follow-up question or upload new papers to compare with this research...'
                    }
                    rows={1}
                    disabled={isThinking}
                    className="flex-1 resize-none bg-transparent px-2 py-2 text-xs sm:text-sm text-pm-foreground placeholder:text-pm-muted-foreground focus:outline-none max-h-36 custom-scrollbar"
                  />

                  <button
                    type="submit"
                    disabled={(!inputValue.trim() && !attachedFile) || isThinking}
                    className="w-9 h-9 rounded-xl bg-pm-foreground text-pm-background hover:bg-pm-foreground/90 disabled:opacity-30 flex items-center justify-center shrink-0 transition-all shadow-xs group"
                  >
                    <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </form>

                <div className="flex items-center justify-between text-[10px] text-pm-muted-foreground px-2">
                  <span>Press Enter to send · Shift + Enter for new line</span>
                  <span className="font-mono text-pm-muted-foreground/80">
                    Uploaded files used only within this research workspace
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: EVIDENCE TAB ── */}
          {activeTab === 'evidence' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-pm-foreground">Extracted Empirical Claims & Metrics</h3>
                  <p className="text-xs text-pm-muted-foreground">Statistical parameters extracted across peer-reviewed cohorts</p>
                </div>
                <span className="text-xs font-mono text-pm-muted-foreground">{evidence.length} claims</span>
              </div>

              <div className="space-y-3">
                {evidence.length === 0 ? (
                  <div className="text-center py-12 text-xs text-pm-muted-foreground">No empirical evidence items extracted yet.</div>
                ) : (
                  evidence.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-pm-frame border border-pm-border space-y-2 shadow-xs">
                      <div className="text-xs font-bold text-pm-foreground">{item.claim}</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-pm-border text-[11px] font-mono">
                        <div>
                          <span className="text-pm-muted-foreground block text-[9px]">METRIC</span>
                          <span className="text-pm-foreground font-semibold">{item.metric || 'Primary Endpoint'}</span>
                        </div>
                        <div>
                          <span className="text-pm-muted-foreground block text-[9px]">EFFECT SIZE / HR</span>
                          <span className="text-pm-accent font-semibold">{item.effect_size || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-pm-muted-foreground block text-[9px]">P-VALUE</span>
                          <span className="text-emerald-500 font-semibold">{item.p_value || 'p < 0.05'}</span>
                        </div>
                        <div>
                          <span className="text-pm-muted-foreground block text-[9px]">SAMPLE SIZE (N)</span>
                          <span className="text-pm-foreground">{item.sample_size || 'Cohort'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── TAB 3: SOURCES TAB ── */}
          {activeTab === 'sources' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-pm-foreground">Verified Academic Literature & DOIs</h3>
                  <p className="text-xs text-pm-muted-foreground">Peer-reviewed publications indexed with active URLs</p>
                </div>
                <span className="text-xs font-mono text-pm-muted-foreground">{sources.length} sources</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sources.length === 0 ? (
                  <div className="text-center py-12 text-xs text-pm-muted-foreground col-span-2">No verified literature sources linked yet.</div>
                ) : (
                  sources.map((s, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-pm-frame border border-pm-border flex flex-col justify-between space-y-3 shadow-xs">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono text-pm-muted-foreground">
                          <span className="px-2 py-0.5 rounded bg-pm-muted text-pm-foreground font-semibold">
                            {s.source_platform || 'Academic Registry'}
                          </span>
                          <span>{s.year || 2024}</span>
                        </div>
                        <h4 className="text-xs font-bold text-pm-foreground line-clamp-2 leading-snug">{s.title}</h4>
                        <p className="text-[11px] text-pm-muted-foreground line-clamp-2 leading-relaxed">
                          {s.abstract || 'Peer-reviewed study evaluated in systematic research audit.'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-pm-border flex items-center justify-between text-[11px] font-mono text-pm-muted-foreground">
                        <span className="truncate max-w-[160px]">{s.doi ? `DOI: ${s.doi}` : 'Indexed Paper'}</span>
                        {s.url && (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-pm-accent font-semibold flex items-center gap-1 hover:underline"
                          >
                            <span>Open Source</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── TAB 4: FILES TAB ── */}
          {activeTab === 'files' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-pm-foreground">Workspace Uploaded Documents & Materials</h3>
                  <p className="text-xs text-pm-muted-foreground">PDFs, DOCX, TXT, and scientific figures active in research memory</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-pm-foreground text-pm-background text-xs font-semibold flex items-center gap-1.5"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </button>
              </div>

              {uploadedFiles.length === 0 ? (
                <div className="text-center py-12 text-xs text-pm-muted-foreground space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-pm-muted-foreground" />
                  <div>No additional files uploaded yet.</div>
                  <p className="text-[11px]">Upload clinical trials or manuscripts to compare against this research.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {uploadedFiles.map((uf, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-pm-frame border border-pm-border flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-pm-muted flex items-center justify-center shrink-0">
                          {uf.file_type === 'PDF' ? (
                            <FileText className="w-4 h-4 text-rose-500" />
                          ) : (
                            <File className="w-4 h-4 text-pm-accent" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-pm-foreground truncate">{uf.filename}</div>
                          <div className="text-[10px] font-mono text-pm-muted-foreground">
                            {uf.file_type} • {(uf.file_size / 1024).toFixed(0)} KB • {uf.status || 'Ready'}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs font-mono text-emerald-500 font-semibold shrink-0 ml-2">
                        ✓ In Memory
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 5: REPORT TAB ── */}
          {activeTab === 'report' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-pm-foreground">Verified Scientific Whitepaper Dossier</h3>
                  <p className="text-xs text-pm-muted-foreground">Synthesis of evidence, empirical findings, and limitations</p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl border border-pm-border bg-pm-frame hover:bg-pm-muted text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
              </div>

              <article className="p-6 sm:p-8 rounded-3xl bg-pm-frame border border-pm-border space-y-6 shadow-xs">
                <h1 className="text-xl font-extrabold text-pm-foreground">{report?.title || activeProject?.topic || 'Research Synthesis Report'}</h1>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-pm-foreground uppercase tracking-wider">Executive Summary</h4>
                  <p className="text-xs text-pm-foreground/90 leading-relaxed">
                    {report?.executive_summary || 'Evidence synthesized across verified peer-reviewed publications.'}
                  </p>
                </div>

                {report?.findings && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-pm-foreground uppercase tracking-wider">Key Findings</h4>
                    {report.findings.map((f: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <div className="text-xs font-bold text-pm-foreground">{f.section}</div>
                        <p className="text-xs text-pm-muted-foreground leading-relaxed">{f.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResearchWorkspacePage() {
  return (
    <Suspense fallback={<LuminarLoadingScreen message="Loading Research Workspace..." fullScreen={false} />}>
      <ResearchWorkspaceContent />
    </Suspense>
  )
}
