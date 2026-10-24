import { STORAGE_FOLDERS, type StorageFolder } from '@/lib/supabase'
import { thumbKey } from '@/features/images/blobRegistry'
import type { DesignProject, ImageMimeType } from '@/types/design'

/**
 * Every image a project references, described uniformly so persistence
 * layers (IndexedDB or Supabase Storage) can save/restore them the same way.
 * `key` is the blob registry key.
 */
export type ImageSlot = {
  key: string
  folder: StorageFolder
  mimeType: ImageMimeType | 'image/webp'
  get: () => { url: string; storagePath?: string }
  set: (url: string, storagePath?: string) => void
}

export function collectImageSlots(project: DesignProject): ImageSlot[] {
  const slots: ImageSlot[] = []

  const refImages = [
    project.overallReference,
    ...project.components.map((c) => c.image),
    ...project.editReferences,
  ]
  for (const img of refImages) {
    if (!img) continue
    slots.push({
      key: img.id,
      folder: STORAGE_FOLDERS.userUploads,
      mimeType: img.mimeType,
      get: () => ({ url: img.imageUrl, storagePath: img.storagePath }),
      set: (url, path) => {
        img.imageUrl = url
        if (path) img.storagePath = path
      },
    })
    slots.push({
      key: thumbKey(img.id),
      folder: STORAGE_FOLDERS.thumbnails,
      mimeType: 'image/webp',
      get: () => ({ url: img.thumbnailUrl ?? '', storagePath: img.thumbnailPath }),
      set: (url, path) => {
        img.thumbnailUrl = url
        if (path) img.thumbnailPath = path
      },
    })
  }

  const gen = project.generatedDesign
  if (gen) {
    slots.push({
      key: gen.id,
      folder: STORAGE_FOLDERS.generatedDesigns,
      mimeType: 'image/png',
      get: () => ({ url: gen.imageUrl, storagePath: gen.storagePath }),
      set: (url, path) => {
        gen.imageUrl = url
        if (path) gen.storagePath = path
      },
    })
  }

  for (const v of project.versions) {
    slots.push({
      key: v.id,
      folder: STORAGE_FOLDERS.designVersions,
      mimeType: 'image/png',
      get: () => ({ url: v.imageUrl, storagePath: v.storagePath }),
      set: (url, path) => {
        v.imageUrl = url
        if (path) v.storagePath = path
      },
    })
  }

  return slots
}

/** Deep clone that keeps the structure but is safe to mutate (no Blobs inside). */
export function cloneProject(project: DesignProject): DesignProject {
  return structuredClone(project)
}
