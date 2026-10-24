/**
 * Client-side configuration. Only PUBLIC values may live here — anything read
 * via import.meta.env with the VITE_ prefix is bundled into the browser code.
 * Secret keys (AI providers, Supabase service role) are read only inside /api.
 */
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured: supabaseUrl.length > 0 && supabaseAnonKey.length > 0,
  aiApiBase: (import.meta.env.VITE_AI_API_BASE ?? '/api').replace(/\/$/, ''),
} as const

export const UPLOAD_LIMITS = {
  maxBytes: 15 * 1024 * 1024,
  acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  acceptAttribute: '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp',
  maxDimension: 8000,
  thumbnailMaxSide: 480,
} as const
