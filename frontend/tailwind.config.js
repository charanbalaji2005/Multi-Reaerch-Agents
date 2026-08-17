/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        display: ['var(--font-display)', 'system-ui'],
      },
      fontFamily: {
        // Landing page font (Palletman uses Space Grotesk display + Inter body via CSS var below)
      },
      colors: {
        // --- Palletman-sourced landing page theme (prefixed to avoid clashing
        // with the dashboard's existing dark "cyber" tokens below) ---
        'pm-background': 'var(--pm-background)',
        'pm-foreground': 'var(--pm-foreground)',
        'pm-muted': 'var(--pm-muted)',
        'pm-muted-foreground': 'var(--pm-muted-foreground)',
        'pm-border': 'var(--pm-border)',
        'pm-ring': 'var(--pm-ring)',
        'pm-frame': 'var(--pm-frame)',
        'pm-accent': 'var(--pm-accent)',
        'pm-card-primary': 'var(--pm-card-primary)',
        'pm-card-secondary': 'var(--pm-card-secondary)',
        'pm-card-foreground': 'var(--pm-card-foreground)',
        'pm-card-foreground-muted': 'var(--pm-card-foreground-muted)',
        'pm-phone-screen': 'var(--pm-phone-screen)',
        // Dark neural theme
        void: '#020408',
        surface: '#080d14',
        panel: '#0d1520',
        border: '#1a2535',
        // Cyan accent
        cyan: {
          DEFAULT: '#00d4ff',
          dim: '#00a8cc',
          glow: 'rgba(0,212,255,0.15)',
        },
        // Emerald for success
        emerald: {
          DEFAULT: '#00ff87',
          dim: '#00cc6a',
          glow: 'rgba(0,255,135,0.15)',
        },
        // Agents colors
        agents: {
          coordinator: '#8b5cf6',
          research: '#3b82f6',
          summarizer: '#06b6d4',
          diagram: '#f59e0b',
          presentation: '#ec4899',
          report: '#10b981',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0,212,255,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0,212,255,0.7), 0 0 40px rgba(0,212,255,0.3)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
        'radial-glow': 'radial-gradient(ellipse at center, rgba(0,212,255,0.08) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
}
