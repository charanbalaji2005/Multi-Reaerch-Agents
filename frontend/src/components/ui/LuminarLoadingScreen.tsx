'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

interface LuminarLoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

const DEFAULT_MESSAGES = [
  'Initializing research workspace...',
  'Loading research agents...',
  'Preparing scholarly search...',
  'Checking research services...',
  'Preparing your workspace...',
]

export default function LuminarLoadingScreen({
  message,
  fullScreen = true,
}: LuminarLoadingScreenProps) {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    if (message) return // If a fixed message was provided, don't cycle

    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % DEFAULT_MESSAGES.length)
    }, 1800)

    return () => clearInterval(interval)
  }, [message])

  const currentMessage = message || DEFAULT_MESSAGES[msgIndex]

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Luminar AI"
      className={`${
        fullScreen ? 'fixed inset-0 z-[9999]' : 'w-full h-full min-h-[400px]'
      } bg-white text-[#0F172A] flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden font-sans`}
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 45%, rgba(99, 102, 241, 0.06) 0%, transparent 50%)',
      }}
    >
      {/* Top Spacer for balanced vertical centering */}
      <div className="h-6 w-full" />

      {/* Center Content Container */}
      <div className="flex flex-col items-center justify-center text-center max-w-sm w-full space-y-6">
        {/* Animated Brand Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{
            opacity: 1,
            scale: [1, 1.03, 1],
          }}
          transition={{
            opacity: { duration: 0.5, ease: 'easeOut' },
            scale: {
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.5, 1],
            },
          }}
          className="relative flex items-center justify-center"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -inset-2 rounded-3xl bg-indigo-500/10 blur-xl pointer-events-none" />

          {/* Logo Frame */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-[#E2E8F0] shadow-md shadow-indigo-950/5 flex items-center justify-center p-2 overflow-hidden">
            <Image
              src="/logo.png"
              alt="Luminar AI"
              width={64}
              height={64}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </motion.div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1.5">
          <motion.h1
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-xl sm:text-2xl font-bold tracking-[0.08em] text-[#0F172A] uppercase"
          >
            LUMINAR AI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-xs sm:text-sm font-normal text-[#64748B]"
          >
            Autonomous Research Intelligence
          </motion.p>
        </div>

        {/* Three Animated Sequential Dots */}
        <div className="flex items-center justify-center gap-2 py-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-[#6366F1]"
              animate={{
                opacity: [0.25, 1, 0.25],
                scale: [0.85, 1.25, 0.85],
                y: [0, -3, 0],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Rotating Status Message */}
        <div className="h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentMessage}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.25 }}
              className="text-xs text-[#64748B] font-medium tracking-tight"
            >
              {currentMessage}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Indeterminate Smooth Progress Bar */}
        <div className="w-48 sm:w-56 h-[3px] bg-[#E2E8F0] rounded-full overflow-hidden relative">
          <motion.div
            className="absolute top-0 bottom-0 w-24 bg-[#6366F1] rounded-full"
            animate={{
              x: [-100, 240],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      </div>

      {/* Bottom Branding Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-center text-[11px] text-[#94A3B8] font-normal tracking-wide space-y-0.5"
      >
        <div className="font-semibold text-[#64748B] uppercase tracking-widest text-[10px]">
          LUMINAR AI
        </div>
        <div>Research intelligence, grounded in evidence.</div>
      </motion.div>
    </div>
  )
}
