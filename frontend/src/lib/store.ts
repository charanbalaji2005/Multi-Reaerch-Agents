import { create } from 'zustand'
import { saveAuthSession, clearAuthSession, getAuthSession } from './session'

interface User {
  id: string
  name: string
  email: string
  projects_count: number
  picture?: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isLoading: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  loadFromStorage: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: (user, token) => {
    saveAuthSession(token, user)
    set({ user, token, isLoading: false })
  },

  logout: () => {
    clearAuthSession()
    set({ user: null, token: null, isLoading: false })
  },

  loadFromStorage: () => {
    try {
      const { token, user } = getAuthSession()
      if (token && user) {
        set({ user, token, isLoading: false })
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },
}))
