const SUPABASE_URL = 'https://udzrprvunbmuibtzwnqo.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkenJwcnZ1bmJtdWlidHp3bnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NzEzMjYsImV4cCI6MjEwODQ0NzMyNn0.K2l-Kx4gEMeitUGWMg7y8STEihFGF-6y-S-VAwwOnns'

const supabaseUrl = SUPABASE_URL
const supabaseAnonKey = SUPABASE_ANON_KEY

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
