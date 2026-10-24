import { STORAGE_BUCKET, STORAGE_FOLDERS, supabase, type StorageFolder } from '@/lib/supabase'

const SIGNED_URL_TTL_SECONDS = 60 * 60

function extFromType(type: string): string {
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/webp') return 'webp'
  if (type === 'image/png') return 'png'
  if (type === 'video/mp4') return 'mp4'
  return 'bin'
}

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

/**
 * Private bucket layout: `${userId}/${folder}/${projectId}/${fileId}.${ext}`.
 * The first path segment is the owner's id — storage RLS policies enforce it.
 * File names are generated ids; customer file names are never used.
 */
export const storageService = {
  buildPath(userId: string, folder: StorageFolder, projectId: string, fileId: string, mimeType: string): string {
    return `${userId}/${folder}/${projectId}/${fileId}.${extFromType(mimeType)}`
  },

  async upload(path: string, blob: Blob): Promise<string> {
    const client = requireClient()
    const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, blob, {
      contentType: blob.type || 'application/octet-stream',
      cacheControl: '31536000',
      upsert: true,
    })
    if (error) throw error
    return path
  },

  async signedUrls(paths: string[]): Promise<Map<string, string>> {
    const out = new Map<string, string>()
    const unique = [...new Set(paths.filter(Boolean))]
    if (unique.length === 0) return out
    const client = requireClient()
    const { data, error } = await client.storage
      .from(STORAGE_BUCKET)
      .createSignedUrls(unique, SIGNED_URL_TTL_SECONDS)
    if (error) throw error
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) out.set(item.path, item.signedUrl)
    }
    return out
  },

  async download(path: string): Promise<Blob> {
    const client = requireClient()
    const { data, error } = await client.storage.from(STORAGE_BUCKET).download(path)
    if (error || !data) throw error ?? new Error('Download failed')
    return data
  },

  /** Remove every file of a project across all folders. */
  async removeProjectFiles(userId: string, projectId: string): Promise<void> {
    const client = requireClient()
    const bucket = client.storage.from(STORAGE_BUCKET)
    for (const folder of Object.values(STORAGE_FOLDERS)) {
      const prefix = `${userId}/${folder}/${projectId}`
      const { data } = await bucket.list(prefix, { limit: 1000 })
      const files = (data ?? []).map((f) => `${prefix}/${f.name}`)
      if (files.length > 0) await bucket.remove(files)
    }
  },
}
