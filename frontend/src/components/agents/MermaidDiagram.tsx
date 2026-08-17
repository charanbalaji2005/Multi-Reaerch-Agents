'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  code: string
  title?: string
}

function sanitizeMermaid(raw: string): string {
  if (!raw) return ''
  let cleaned = raw.replace(/^```(?:mermaid)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return cleaned
}

export default function MermaidDiagram({ code, title }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [renderMode, setRenderMode] = useState<'mermaid' | 'fallback'>('mermaid')
  const cleanCode = sanitizeMermaid(code)

  useEffect(() => {
    if (!cleanCode) return
    let isMounted = true

    const render = async () => {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          darkMode: true,
          securityLevel: 'loose',
          themeVariables: {
            background: '#0a0f1d',
            primaryColor: '#1e1b4b',
            primaryTextColor: '#f8fafc',
            primaryBorderColor: '#6366f1',
            lineColor: '#818cf8',
            secondaryColor: '#0f172a',
            tertiaryColor: '#0f172a',
            edgeLabelBackground: '#0a0f1d',
            nodeTextColor: '#f8fafc',
          },
          mindmap: { padding: 20 },
        })

        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`
        const { svg } = await mermaid.render(id, cleanCode)
        if (ref.current && isMounted) {
          ref.current.innerHTML = svg
          setRenderMode('mermaid')
        }
      } catch (e: any) {
        console.warn('Mermaid native render failed, falling back to Interactive SVG Graph:', e)
        if (isMounted) {
          setRenderMode('fallback')
        }
      }
    }

    render()
    return () => {
      isMounted = false
    }
  }, [cleanCode])

  // Extract structured steps from code for fallback rendering
  const parseNodes = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim() && !l.trim().startsWith('graph') && !l.trim().startsWith('mindmap'))
    const nodes: string[] = []
    lines.forEach(l => {
      const match = l.match(/\["?(.*?)"?\]|\("?(.*?)"?\)|root\("?(.*?)"?\)/)
      if (match) {
        const val = match[1] || match[2] || match[3]
        if (val && !nodes.includes(val.trim())) {
          nodes.push(val.trim())
        }
      } else {
        const clean = l.replace(/[-><|root\s]/g, ' ').trim()
        if (clean.length > 3 && !nodes.includes(clean)) {
          nodes.push(clean)
        }
      }
    })
    return nodes.length > 0 ? nodes : ['Research Question', 'Academic Discovery', 'Evidence Extraction', 'Citation Verification', 'Critic Audit', 'Verified Whitepaper']
  }

  const nodes = parseNodes(cleanCode)

  return (
    <div className="w-full">
      {renderMode === 'mermaid' ? (
        <div
          ref={ref}
          className="w-full flex items-center justify-center overflow-x-auto py-4 [&_svg]:max-w-full [&_svg]:h-auto"
          style={{ minHeight: '220px' }}
        />
      ) : (
        /* Rich Interactive SVG Scientific Node Flow Graph Fallback */
        <div className="w-full flex flex-col items-center justify-center p-6 bg-slate-900/60 rounded-xl border border-indigo-500/20">
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-full">
            {nodes.slice(0, 6).map((nodeText, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="px-4 py-3 rounded-xl bg-slate-800/90 border border-indigo-500/30 text-xs font-semibold text-slate-100 shadow-lg shadow-indigo-950/40 flex items-center gap-2 hover:border-indigo-400 transition-all">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-[10px] text-indigo-300 font-mono">
                    {idx + 1}
                  </span>
                  <span>{nodeText}</span>
                </div>
                {idx < Math.min(nodes.length, 6) - 1 && (
                  <div className="text-indigo-400 font-bold text-sm hidden sm:inline">➔</div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Multi-Agent Evidence & Verification Protocol Node Graph</span>
          </div>
        </div>
      )}
    </div>
  )
}
