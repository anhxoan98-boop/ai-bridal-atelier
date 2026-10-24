import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { authService } from '@/services/auth/authService'

type AuthContextValue = {
  user: User | null
  loading: boolean
  /** 'cloud' = Supabase accounts; 'local' = no backend configured, designs stay in this browser. */
  mode: 'cloud' | 'local'
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const mode = authService.isAvailable() ? 'cloud' : 'local'
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(mode === 'cloud')

  useEffect(() => {
    if (mode === 'local') return
    let active = true
    authService.getSession().then((session) => {
      if (!active) return
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const unsubscribe = authService.onChange((u) => setUser(u))
    return () => {
      active = false
      unsubscribe()
    }
  }, [mode])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, mode, signOut: () => authService.signOut() }),
    [user, loading, mode],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
