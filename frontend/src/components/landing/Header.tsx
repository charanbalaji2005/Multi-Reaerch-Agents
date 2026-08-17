'use client'

import Image from 'next/image'
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { useAuthStore } from '@/lib/store'

const ease = [0.23, 1, 0.32, 1] as const

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'Research', href: '/dashboard/chat' },
  { label: 'Solutions', href: '#how-it-works' },
  { label: 'Resources', href: '#faq' },
  { label: 'Pricing', href: '#pricing' },
]

function HamburgerIcon({ isOpen }: { isOpen: boolean }): ReactNode {
  return (
    <div className="w-6 h-3.5 relative flex flex-col justify-between cursor-pointer">
      <motion.span
        className="block h-0.5 w-full bg-neutral-900 dark:bg-white origin-center rounded-full"
        animate={isOpen ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.2, ease }}
      />
      <motion.span
        className="block h-0.5 w-full bg-neutral-900 dark:bg-white origin-center rounded-full"
        animate={isOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.2, ease }}
      />
    </div>
  )
}

export function Header(): ReactNode {
  const router = useRouter()
  const { user } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const primaryHref = user ? '/dashboard' : '/auth'
  const primaryLabel = user ? 'Dashboard' : 'Get Started'

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease }}
      className="fixed top-4 inset-x-0 mx-auto w-[94%] max-w-5xl z-50 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-md border border-neutral-200/80 dark:border-neutral-800 transition-all"
    >
      <div className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <button onClick={() => router.push('/')} className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center p-1 shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          </div>
          <span className="text-base font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Luminar AI
          </span>
        </button>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <span>{item.label}</span>
              {['Features', 'Research', 'Solutions', 'Resources'].includes(item.label) && (
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              )}
            </a>
          ))}
        </nav>

        {/* Right CTA Button */}
        <div className="flex items-center gap-3 shrink-0">
          {!user && (
            <button
              onClick={() => router.push('/auth')}
              className="hidden sm:block text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors px-2 py-1"
            >
              Sign In
            </button>
          )}

          <button
            onClick={() => router.push(primaryHref)}
            className="group relative cursor-pointer inline-flex items-center"
          >
            <span className="relative z-10 pl-4 pr-3 py-2 rounded-full bg-neutral-900 text-white text-xs font-bold whitespace-nowrap flex items-center gap-2 shadow-md hover:bg-neutral-800 transition-colors">
              <span>{primaryLabel}</span>
              <span className="w-6 h-6 rounded-full bg-[#a8d946] text-black flex items-center justify-center">
                <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 text-neutral-900 dark:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <HamburgerIcon isOpen={mobileMenuOpen} />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className="md:hidden overflow-hidden bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 rounded-b-3xl"
          >
            <div className="px-6 py-4 space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:text-neutral-900"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
