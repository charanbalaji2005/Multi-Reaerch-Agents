'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export interface LogoItem {
  node: ReactNode
  href?: string
  title?: string
}

interface LogoLoopProps {
  logos: LogoItem[]
  speed?: number
  direction?: 'left' | 'right'
  logoHeight?: number
  gap?: number
  pauseOnHover?: boolean
  className?: string
}

const SMOOTH_TAU = 0.25
const MIN_COPIES = 2
const COPY_HEADROOM = 2

export function LogoLoop({
  logos,
  speed = 60,
  direction = 'left',
  logoHeight = 32,
  gap = 80,
  pauseOnHover = true,
  className,
}: LogoLoopProps): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const seqRef = useRef<HTMLUListElement>(null)

  const isHoveredRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)
  const offsetRef = useRef(0)
  const velocityRef = useRef(0)
  const seqWidthRef = useRef(0)

  const [copyCount, setCopyCount] = useState(MIN_COPIES)

  const targetVelocity = useMemo(() => {
    const magnitude = Math.abs(speed)
    const directionMultiplier = direction === 'left' ? 1 : -1
    return magnitude * directionMultiplier
  }, [speed, direction])

  const updateDimensions = useCallback(() => {
    const containerWidth = containerRef.current?.clientWidth ?? 0
    const sequenceWidth = seqRef.current?.getBoundingClientRect().width ?? 0

    if (sequenceWidth > 0) {
      seqWidthRef.current = Math.ceil(sequenceWidth)
      const copiesNeeded = Math.ceil(containerWidth / sequenceWidth) + COPY_HEADROOM
      setCopyCount((prev) => {
        const next = Math.max(MIN_COPIES, copiesNeeded)
        return prev === next ? prev : next
      })
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const seq = seqRef.current
    if (!container || !seq) return

    const observer = new ResizeObserver(updateDimensions)
    observer.observe(container)
    observer.observe(seq)

    return () => observer.disconnect()
  }, [updateDimensions, logos])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      track.style.transform = 'translate3d(0, 0, 0)'
      return
    }

    const animate = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp
      }

      const deltaTime = Math.max(0, timestamp - lastTimestampRef.current) / 1000
      lastTimestampRef.current = timestamp

      const target = isHoveredRef.current && pauseOnHover ? 0 : targetVelocity
      const easingFactor = 1 - Math.exp(-deltaTime / SMOOTH_TAU)
      velocityRef.current += (target - velocityRef.current) * easingFactor

      const seqWidth = seqWidthRef.current
      if (seqWidth > 0) {
        let nextOffset = offsetRef.current + velocityRef.current * deltaTime
        nextOffset = ((nextOffset % seqWidth) + seqWidth) % seqWidth
        offsetRef.current = nextOffset
        track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      lastTimestampRef.current = null
    }
  }, [targetVelocity, pauseOnHover])

  const handleMouseEnter = useCallback(() => {
    isHoveredRef.current = true
  }, [])

  const handleMouseLeave = useCallback(() => {
    isHoveredRef.current = false
  }, [])

  return (
    <div className="flex justify-center px-6">
      <div
        ref={containerRef}
        className={`relative overflow-hidden max-w-5xl w-full ${className ?? ''}`}
        style={
          {
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            '--logo-gap': `${gap}px`,
            '--logo-height': `${logoHeight}px`,
          } as React.CSSProperties
        }
      >
        <div
          ref={trackRef}
          className="flex will-change-transform select-none w-max"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {Array.from({ length: copyCount }, (_, copyIndex) => (
            <ul
              key={copyIndex}
              ref={copyIndex === 0 ? seqRef : undefined}
              className="flex items-center"
              aria-hidden={copyIndex > 0}
            >
              {logos.map((item, itemIndex) => (
                <li
                  key={`${copyIndex}-${itemIndex}`}
                  className="flex-none leading-none"
                  style={{ marginRight: 'var(--logo-gap)', fontSize: 'var(--logo-height)' }}
                >
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center text-pm-muted-foreground hover:text-pm-foreground transition-colors"
                      title={item.title}
                    >
                      {item.node}
                    </a>
                  ) : (
                    <span className="inline-flex items-center text-pm-muted-foreground">{item.node}</span>
                  )}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  )
}
