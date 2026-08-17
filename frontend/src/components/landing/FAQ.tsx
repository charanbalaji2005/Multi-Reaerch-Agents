'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

const faqs = [
  {
    question: 'How is ResearchGuard AI different from standard LLM chatbots?',
    answer:
      'Standard chatbots generate fluent text with unverified references that are frequently hallucinated. ResearchGuard distributes the research process across 6 sequential agents: searching real academic APIs (arXiv, PubMed, Semantic Scholar), extracting structured empirical data, independently auditing claim grounding, and stress-testing conclusions with an adversarial critic.',
  },
  {
    question: 'How does the Citation Verification Agent prove claim grounding?',
    answer:
      'The verifier receives the extracted claim and original peer-reviewed source text. It tests whether the source text directly justifies the claim, assigning unambiguous verdicts (SUPPORTED, PARTIALLY_SUPPORTED, CONTRADICTED, or UNSUPPORTED) alongside an evidence match confidence score.',
  },
  {
    question: 'What academic literature sources are supported?',
    answer:
      'ResearchGuard directly integrates with the arXiv API, Semantic Scholar Graph API, Crossref Works API, and PubMed/Google Scholar indices. Users can also upload custom PDF/DOCX manuscripts or supply specific DOI URLs.',
  },
  {
    question: 'How is the Research Integrity Score calculated?',
    answer:
      'The Research Integrity Score (0-100) mathematically weights the ratio of verified supported claims, penalizes contradicted or unsupported claims, and incorporates the methodological quality scores of the underlying publication venues.',
  },
  {
    question: 'How does ResearchGuard achieve high cost efficiency?',
    answer:
      'Powered by Groq LLM (Llama 3.3 70B Versatile), ResearchGuard generates full 6-agent verification dossiers in under 40 seconds at an estimated cost of approximately $0.01 per complete inquiry.',
  },
]

const ease = [0.23, 1, 0.32, 1] as const

function FAQItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: (typeof faqs)[0]
  index: number
  isOpen: boolean
  onToggle: () => void
}): ReactNode {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease, delay: index * 0.05 }}
      onClick={onToggle}
      className="cursor-pointer rounded-2xl bg-pm-frame border border-pm-border p-5 shadow-sm sm:p-6"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      aria-expanded={isOpen}
    >
      <div className="flex w-full items-center justify-between gap-4 text-left">
        <span className="text-base font-medium text-pm-foreground sm:text-lg">{faq.question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3, ease }} className="shrink-0">
          <ChevronDown className="h-5 w-5 text-pm-muted-foreground" />
        </motion.div>
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <p className="pt-4 text-sm leading-relaxed text-pm-muted-foreground sm:text-base">{faq.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const router = useRouter()
  const { user } = useAuthStore()

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="w-full px-6 py-20 sm:py-24 bg-pm-background">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mb-12 text-center sm:mb-16"
        >
          <span className="text-sm font-medium text-pm-muted-foreground">Frequently Asked Questions</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-pm-foreground sm:text-4xl lg:text-5xl">
            Common questions
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-pm-muted-foreground sm:text-lg">
            Everything you need to know about ResearchGuard AI and multi-agent citation verification.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <motion.button
              onClick={() => router.push(user ? '/dashboard/research' : '/auth')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center rounded-xl bg-pm-foreground px-6 py-2.5 text-sm font-semibold text-pm-background transition-colors hover:opacity-90"
            >
              Open dashboard
            </motion.button>
            <motion.a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center rounded-xl border border-pm-border bg-pm-frame px-6 py-2.5 text-sm font-semibold text-pm-foreground transition-colors"
            >
              View on GitHub
            </motion.a>
          </div>
        </motion.div>

        <div className="flex flex-col gap-3" role="list">
          {faqs.map((faq, index) => (
            <FAQItem key={index} faq={faq} index={index} isOpen={openIndex === index} onToggle={() => handleToggle(index)} />
          ))}
        </div>
      </div>
    </section>
  )
}
