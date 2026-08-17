'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ShieldCheck, ArrowRight, Mail, Lock, User, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { ThemeSwitch } from '@/components/landing/ThemeSwitch'

declare global {
  interface Window {
    google?: any
  }
}

const GOOGLE_CLIENT_ID = '644632951361-lrjmck8mkvqt8ekiveju75pletd8b9g8.apps.googleusercontent.com'

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const { setAuth, user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (user) router.push('/dashboard')
  }, [user, router])

  // Google OAuth Callback Handler
  const handleGoogleCredentialResponse = useCallback(
    async (response: any) => {
      setGoogleLoading(true)
      try {
        if (!response.credential) {
          throw new Error('No credential received from Google')
        }

        // Decode JWT token payload
        const base64Url = response.credential.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
        const googleUser = JSON.parse(jsonPayload)

        const email = googleUser.email
        const name = googleUser.name || email.split('@')[0]
        const oauthPassword = `GAuth_${googleUser.sub}_RG2026!`

        let authData: any = null

        // 1. Try to login
        try {
          authData = await authAPI.login({ email, password: oauthPassword })
        } catch (loginErr: any) {
          // 2. If user doesn't exist, automatically register
          try {
            authData = await authAPI.register({ name, email, password: oauthPassword })
          } catch (regErr: any) {
            // If already registered with another password, try logging in
            throw new Error(regErr.response?.data?.detail || 'Google authentication failed to sync with database')
          }
        }

        const userData = authData?.user || authData?.data?.user
        const token = authData?.access_token || authData?.data?.access_token

        if (userData && token) {
          if (googleUser.picture) {
            userData.picture = googleUser.picture
          }
          setAuth(userData, token)
          toast.success(`Welcome, ${userData.name || 'Researcher'}!`)
          router.push('/dashboard')
        } else {
          throw new Error('Invalid authentication response')
        }
      } catch (err: any) {
        toast.error(err.message || 'Google Sign-In failed')
      } finally {
        setGoogleLoading(false)
      }
    },
    [router, setAuth]
  )

  // Initialize Google Identity Services SDK
  useEffect(() => {
    const initializeGoogleGSI = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          })
        } catch (e) {
          console.warn('Google GSI initialization error:', e)
        }
      }
    }

    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script')
      script.id = 'google-gsi-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initializeGoogleGSI
      document.body.appendChild(script)
    } else {
      initializeGoogleGSI()
    }
  }, [handleGoogleCredentialResponse])

  // Trigger Google Login
  const handleGoogleSignInClick = () => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to implicit OAuth popup if One-Tap is blocked
          const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
            window.location.origin + '/auth'
          )}&response_type=token%20id_token&scope=openid%20email%20profile&nonce=${Date.now()}`
          window.location.href = oauthUrl
        }
      })
    } else {
      toast.error('Google Sign-In SDK is loading, please try in a moment.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res: any =
        mode === 'register'
          ? await authAPI.register(form)
          : await authAPI.login({ email: form.email, password: form.password })

      const userData = res?.user || res?.data?.user
      const token = res?.access_token || res?.data?.access_token

      if (userData && token) {
        setAuth(userData, token)
        toast.success(mode === 'register' ? 'Account created successfully!' : 'Welcome back!')
        router.push('/dashboard')
      } else {
        throw new Error(res?.detail || 'Authentication response was invalid')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-pm-background text-pm-foreground font-[family-name:var(--font-pm-sans)] flex flex-col items-center justify-center p-4 sm:p-6 relative antialiased">
      {/* Site Frame Chrome */}
      <div className="pm-site-frame pm-site-frame--top" aria-hidden="true" />
      <div className="pm-site-frame pm-site-frame--bottom" aria-hidden="true" />
      <div className="pm-site-frame pm-site-frame--left" aria-hidden="true" />
      <div className="pm-site-frame pm-site-frame--right" aria-hidden="true" />

      <svg className="pm-site-corner pm-site-corner--top-left" width="50" height="50" viewBox="0 0 50 50" fill="none" aria-hidden="true">
        <path d="M5.50871e-06 0C-0.00788227 37.3001 8.99616 50.0116 50 50H5.50871e-06V0Z" fill="currentColor" />
      </svg>
      <svg className="pm-site-corner pm-site-corner--top-right" width="50" height="50" viewBox="0 0 50 50" fill="none" aria-hidden="true">
        <path d="M5.50871e-06 0C-0.00788227 37.3001 8.99616 50.0116 50 50H5.50871e-06V0Z" fill="currentColor" />
      </svg>
      <svg className="pm-site-corner pm-site-corner--bottom-left" width="50" height="50" viewBox="0 0 50 50" fill="none" aria-hidden="true">
        <path d="M5.50871e-06 0C-0.00788227 37.3001 8.99616 50.0116 50 50H5.50871e-06V0Z" fill="currentColor" />
      </svg>
      <svg className="pm-site-corner pm-site-corner--bottom-right" width="50" height="50" viewBox="0 0 50 50" fill="none" aria-hidden="true">
        <path d="M5.50871e-06 0C-0.00788227 37.3001 8.99616 50.0116 50 50H5.50871e-06V0Z" fill="currentColor" />
      </svg>

      <ThemeSwitch />

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-pm-frame border border-pm-border text-sm font-medium text-pm-muted-foreground hover:text-pm-foreground transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to home</span>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md my-12"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-pm-foreground text-pm-background mb-4 shadow-lg">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-pm-foreground">
            ResearchGuard AI
          </h1>
          <p className="text-xs uppercase tracking-widest font-mono text-pm-muted-foreground mt-1.5">
            Multi-Agent Evidence & Citation Audit
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-pm-frame border border-pm-border rounded-3xl p-6 sm:p-8 shadow-xl">
          {/* Tab Switcher */}
          <div className="flex bg-pm-muted p-1 rounded-2xl border border-pm-border mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 capitalize ${
                  mode === m
                    ? 'bg-pm-foreground text-pm-background shadow-sm'
                    : 'text-pm-muted-foreground hover:text-pm-foreground'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* ── GOOGLE AUTH BUTTON ── */}
          <div className="mb-5">
            <button
              type="button"
              onClick={handleGoogleSignInClick}
              disabled={googleLoading || loading}
              className="w-full py-3 px-4 rounded-xl bg-pm-background border border-pm-border hover:border-pm-ring/40 text-pm-foreground text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-200 shadow-sm hover:shadow group disabled:opacity-50"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-pm-foreground/40 border-t-pm-foreground rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-pm-border" />
            <span className="text-[11px] font-mono uppercase text-pm-muted-foreground font-semibold tracking-wider">
              Or with email
            </span>
            <div className="flex-1 h-px bg-pm-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-xs font-semibold text-pm-muted-foreground uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-muted-foreground" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Dr. Eleanor Vance"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-pm-background border border-pm-border text-pm-foreground text-sm focus:outline-none focus:ring-2 focus:ring-pm-ring focus:border-transparent transition-all"
                      required={mode === 'register'}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-semibold text-pm-muted-foreground uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-muted-foreground" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="researcher@lab.edu"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-pm-background border border-pm-border text-pm-foreground text-sm focus:outline-none focus:ring-2 focus:ring-pm-ring focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-pm-muted-foreground uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-muted-foreground" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-pm-background border border-pm-border text-pm-foreground text-sm focus:outline-none focus:ring-2 focus:ring-pm-ring focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-pm-muted-foreground hover:text-pm-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-2 py-3.5 px-6 rounded-xl bg-pm-foreground text-pm-background hover:bg-pm-foreground/90 font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md group disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-pm-background/40 border-t-pm-background rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Mission Control' : 'Create Researcher Account'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-pm-muted-foreground mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-pm-foreground font-semibold underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { label: '6 Agent Engine', sub: 'Autonomous' },
            { label: 'PubMed & arXiv', sub: 'Peer-reviewed' },
            { label: 'Audit Reports', sub: 'Grounding' },
          ].map((f) => (
            <div key={f.label} className="bg-pm-frame border border-pm-border rounded-2xl p-3 text-center shadow-sm">
              <div className="text-xs font-semibold text-pm-foreground">{f.label}</div>
              <div className="text-[10px] text-pm-muted-foreground mt-0.5">{f.sub}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
