'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Sidebar from '@/components/layout/Sidebar'
import { Menu, ShieldCheck } from 'lucide-react'
import { ThemeSwitch } from '@/components/landing/ThemeSwitch'

import LuminarLoadingScreen from '@/components/ui/LuminarLoadingScreen'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loadFromStorage, isLoading } = useAuthStore()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <LuminarLoadingScreen message="Initializing research workspace..." />
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-pm-background text-pm-foreground font-[family-name:var(--font-pm-sans)] relative antialiased">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-pm-frame/95 backdrop-blur-md border-b border-pm-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-pm-muted-foreground hover:text-pm-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-pm-foreground text-pm-background flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-pm-foreground tracking-wider">RESEARCHGUARD AI</span>
          </div>
        </div>
      </div>

      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <main className="flex-1 w-full md:ml-64 min-h-screen overflow-x-hidden pt-14 md:pt-0 bg-pm-background">
        {children}
      </main>

      <ThemeSwitch />

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
