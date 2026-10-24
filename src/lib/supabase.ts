import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/config/env'

/**
 * Browser Supabase client (anon key only — row level security protects data).
 * `null` when Supabase is not configured: the app then runs in local mode.
 */
export const supabase: SupabaseClient | null = env.isSupabaseConfigured
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export const STORAGE_BUCKET = 'bridal-designs'

/** Folder layout inside the private bucket: `${userId}/${folder}/${projectId}/${file}` */
export const STORAGE_FOLDERS = {
  userUploads: 'user-uploads',
  generatedDesigns: 'generated-designs',
  designVersions: 'design-versions',
  thumbnails: 'thumbnails',
  aiVideo: 'ai-video',
} as const

export type StorageFolder = (typeof STORAGE_FOLDERS)[keyof typeof STORAGE_FOLDERS]
