import { supabase } from '@/lib/supabase'
import type { LibraryCategory, LibraryImage, LibraryPage } from '@/types/library'

const PAGE_SIZE = 24
const LIBRARY_BUCKET = 'bridal-library'

type LibraryRow = {
  id: string
  category: LibraryCategory
  storage_path: string
  thumbnail_path: string
  width: number
  height: number
}

/**
 * Shared reference library. Paginated so the grid never loads hundreds of
 * full-resolution images: thumbnails first, the original only on open.
 * Returns an empty page when the library has not been populated yet.
 */
export const libraryService = {
  isAvailable(): boolean {
    return supabase !== null
  },

  async listPage(category: LibraryCategory | 'all', cursor = 0): Promise<LibraryPage> {
    if (!supabase) return { items: [], nextCursor: null }
    let query = supabase
      .from('library_images')
      .select('id,category,storage_path,thumbnail_path,width,height')
      .order('sort_order', { ascending: true })
      .range(cursor, cursor + PAGE_SIZE - 1)
    if (category !== 'all') query = query.eq('category', category)
    const { data, error } = await query
    if (error) throw error
    const rows = (data ?? []) as LibraryRow[]
    const bucket = supabase.storage.from(LIBRARY_BUCKET)
    const items: LibraryImage[] = rows.map((r) => ({
      id: r.id,
      category: r.category,
      imageUrl: bucket.getPublicUrl(r.storage_path).data.publicUrl,
      thumbnailUrl: bucket.getPublicUrl(r.thumbnail_path).data.publicUrl,
      width: r.width,
      height: r.height,
    }))
    return { items, nextCursor: rows.length === PAGE_SIZE ? cursor + PAGE_SIZE : null }
  },
}
