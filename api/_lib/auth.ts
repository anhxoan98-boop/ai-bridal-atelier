/**
 * Verifies the caller's Supabase session when Supabase is configured on the
 * server. In local mode (no Supabase) requests are allowed so the studio can
 * run on a single machine.
 */
export type Caller = { userId: string | null }

export async function authenticate(request: Request): Promise<Caller | null> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) return { userId: null }

  const header = request.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return null

  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    })
    if (!res.ok) return null
    const user = (await res.json()) as { id?: string }
    return user.id ? { userId: user.id } : null
  } catch {
    return null
  }
}
