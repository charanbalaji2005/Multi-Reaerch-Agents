'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export type AvatarState = 'idle' | 'thinking' | 'writing' | 'complete'

interface AssistantAvatarProps {
  state?: AvatarState
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AssistantAvatar({
  state = 'idle',
  size = 'md',
  className = '',
}: AssistantAvatarProps): ReactNode {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

  const iconSizeMap = {
    sm: 14,
    md: 18,
    lg: 22,
  }

  const pxSize = iconSizeMap[size]

  return (
    <div
      className={`relative rounded-xl flex items-center justify-center bg-pm-foreground text-pm-background shrink-0 select-none shadow-sm transition-all duration-300 ${sizeMap[size]} ${className}`}
    >
      {/* Subtle Glow Ring on Thinking & Writing */}
      {(state === 'thinking' || state === 'writing') && (
        <motion.div
          className="absolute -inset-1 rounded-xl bg-pm-accent/40 -z-10 blur-sm"
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [0.95, 1.08, 0.95],
          }}
          transition={{
            duration: state === 'thinking' ? 1.4 : 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Original 4-Point Geometric Sparkle SVG */}
      <motion.svg
        width={pxSize}
        height={pxSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={
          state === 'thinking'
            ? { rotate: [0, 90, 180, 270, 360], scale: [0.9, 1.1, 0.9] }
            : state === 'writing'
            ? { scale: [1, 1.08, 1] }
            : { scale: 1, rotate: 0 }
        }
        transition={
          state === 'thinking'
            ? { duration: 3, repeat: Infinity, ease: 'linear' }
            : state === 'writing'
            ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.2 }
        }
      >
        {/* Four-Point Geometric Sparkle Path */}
        <path
          d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4771 12 22C12 16.4771 16.4771 12 22 12C16.4771 12 12 7.52285 12 2Z"
          fill="currentColor"
          className="text-pm-background"
        />
        {/* Accent Center Dot */}
        <circle cx="12" cy="12" r="1.8" fill="var(--pm-accent, #a8d946)" />
      </motion.svg>
    </div>
  )
}
