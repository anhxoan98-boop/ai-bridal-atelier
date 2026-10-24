import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type AuthResult = { ok: true; needsEmailConfirmation?: boolean } | { ok: false; message: string }

function friendly(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'That email and password do not match. Please try again.'
  if (m.includes('already registered')) return 'An account with this email already exists. Please log in.'
  if (m.includes('password')) return message
  return 'Something went wrong. Please try again.'
}

/** Thin wrapper over Supabase Auth so pages never import the SDK directly. */
export const authService = {
  isAvailable(): boolean {
    return supabase !== null
  },

  async signUp(email: string, password: string): Promise<AuthResult> {
    if (!supabase) return { ok: false, message: 'Accounts are not configured yet.' }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/design` },
    })
    if (error) return { ok: false, message: friendly(error.message) }
    return { ok: true, needsEmailConfirmation: !data.session }
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    if (!supabase) return { ok: false, message: 'Accounts are not configured yet.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, message: friendly(error.message) }
    return { ok: true }
  },

  /** Prepared for later — enable the Google provider in Supabase, then expose a button. */
  async signInWithGoogle(): Promise<AuthResult> {
    if (!supabase) return { ok: false, message: 'Accounts are not configured yet.' }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/design` },
    })
    if (error) return { ok: false, message: friendly(error.message) }
    return { ok: true }
  },

  async signOut(): Promise<void> {
    await supabase?.auth.signOut()
  },

  async getSession(): Promise<Session | null> {
    if (!supabase) return null
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  onChange(cb: (user: User | null) => void): () => void {
    if (!supabase) return () => {}
    const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  },
}
