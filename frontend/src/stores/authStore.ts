import { create } from 'zustand'
import type { User } from 'firebase/auth'
import { onAuthChange } from '@/lib/firebase'

interface AuthState {
  user: User | null
  isLoading: boolean
  idToken: string | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setIdToken: (token: string | null) => void
  initializeAuth: () => () => void
  refreshToken: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  idToken: null,
  isAuthenticated: false,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false
    })
  },

  setIdToken: (token) => {
    set({ idToken: token })
  },

  initializeAuth: () => {
    const unsubscribe = onAuthChange(async (user) => {
      set({ user, isAuthenticated: !!user, isLoading: false })

      if (user) {
        try {
          const token = await user.getIdToken()
          set({ idToken: token })
        } catch (error) {
          console.error('Error getting ID token:', error)
        }
      } else {
        set({ idToken: null })
      }
    })

    return unsubscribe
  },

  refreshToken: async () => {
    const user = get().user
    if (user) {
      try {
        const token = await user.getIdToken(true) // Force refresh
        set({ idToken: token })
      } catch (error) {
        console.error('Error refreshing token:', error)
      }
    }
  }
}))
