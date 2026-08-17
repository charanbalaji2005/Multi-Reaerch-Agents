'use client'
import { useRef, useEffect, useState } from 'react'

const headline =
  "ResearchGuard AI eliminates hallucinated citations and ungrounded claims in scientific research: every finding is traced to peer-reviewed literature, cross-examined by independent verifiers, and stress-tested by an adversarial critic before report synthesis."

export function BlurInHeadline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const words = headline.split(' ')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let ticking = false
    const handleScroll = () => {
      if (ticking) return
      ticking = true

      requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect()
        const windowHeight = window.innerHeight
        const startOffset = windowHeight * 0.85
        const endOffset = windowHeight * 0.25

        const progress = Math.min(
          1,
          Math.max(0, (startOffset - rect.top) / (startOffset - endOffset))
        )

        setScrollProgress(progress)
        ticking = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section id="problem" ref={containerRef} className="w-full py-24 px-6 bg-pm-background">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-pm-accent" />
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-pm-muted-foreground">
            The Hallucination Dilemma in AI Research
          </span>
        </div>
        <p className="text-2xl sm:text-4xl md:text-5xl font-medium text-left leading-snug tracking-tight text-pm-foreground">
          {words.map((word, index) => {
            const wordStart = index / words.length
            const wordEnd = wordStart + 1 / words.length
            const wordProgress = Math.min(1, Math.max(0, (scrollProgress - wordStart) / (wordEnd - wordStart)))
            const opacity = 0.18 + wordProgress * 0.82
            const blur = (1 - wordProgress) * 6

            return (
              <span
                key={index}
                className="mr-2.5 inline-block"
                style={{
                  opacity,
                  filter: `blur(${blur}px)`,
                  transition: 'opacity 80ms, filter 80ms',
                }}
              >
                {word}
              </span>
            )
          })}
        </p>
      </div>
    </section>
  )
}
