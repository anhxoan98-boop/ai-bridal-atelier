import { blobRegistry } from '@/features/images/blobRegistry'
import type { DesignProject, DesignProjectSummary } from '@/types/design'
import { idb } from '@/services/storage/indexedDb'
import { cloneProject, collectImageSlots } from '@/services/storage/imageSlots'
import type { DesignRepository } from './designRepository'
import { buildCoverThumbnail } from './coverThumbnail'

type StoredProject = {
  project: DesignProject
  coverKey?: string
}

const blobKey = (projectId: string, key: string) => `${projectId}/${key}`

/**
 * Stores projects and their images in this browser's IndexedDB.
 * Used when Supabase is not configured, and for draft autosave.
 */
export class LocalDesignRepository implements DesignRepository {
  readonly mode = 'local' as const
  private readonly store: 'projects' | 'drafts'

  constructor(store: 'projects' | 'drafts') {
    this.store = store
  }

  async list(): Promise<DesignProjectSummary[]> {
    const rows = await idb.getAll<StoredProject>(this.store)
    const summaries = await Promise.all(
      rows.map(async ({ project, coverKey }) => {
        let coverImageUrl: string | undefined
        if (coverKey) {
          const blob = await idb.get<Blob>('blobs', coverKey)
          if (blob) coverImageUrl = blobRegistry.put(coverKey, blob)
        }
        return {
          id: project.id,
          title: project.title,
          status: project.status,
          coverImageUrl,
          versionCount: project.versions.length,
          updatedAt: project.updatedAt,
        } satisfies DesignProjectSummary
      }),
    )
    return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async load(projectId: string): Promise<DesignProject> {
    const row = await idb.get<StoredProject>(this.store, projectId)
    if (!row) throw new Error('Design not found')
    const project = cloneProject(row.project)
    for (const slot of collectImageSlots(project)) {
      const blob = await idb.get<Blob>('blobs', blobKey(row.project.id, slot.key))
      if (blob) slot.set(blobRegistry.put(slot.key, blob))
    }
    return project
  }

  async save(project: DesignProject, storageId: string = project.id): Promise<DesignProject> {
    const copy = cloneProject(project)
    for (const slot of collectImageSlots(copy)) {
      const blob = blobRegistry.get(slot.key)
      if (blob) {
        await idb.set('blobs', blobKey(project.id, slot.key), blob)
        slot.set('') // object URLs are session-only; rebuilt from the blob on load
      }
    }
    let coverKey: string | undefined
    if (this.store === 'projects') {
      const cover = await buildCoverThumbnail(project)
      if (cover) {
        coverKey = blobKey(project.id, 'cover')
        await idb.set('blobs', coverKey, cover)
      }
    }
    await idb.set(this.store, storageId, { project: copy, coverKey } satisfies StoredProject)
    return project
  }

  async remove(projectId: string): Promise<void> {
    await idb.delete(this.store, projectId)
    const keys = await idb.keys('blobs')
    await Promise.all(
      keys
        .filter((k) => typeof k === 'string' && k.startsWith(`${projectId}/`))
        .map((k) => idb.delete('blobs', k as string)),
    )
  }

  /** Draft helpers: a single slot keyed independently of the project id. */
  async loadSlot(slotId: string): Promise<DesignProject | null> {
    const row = await idb.get<StoredProject>(this.store, slotId)
    if (!row) return null
    const project = cloneProject(row.project)
    for (const slot of collectImageSlots(project)) {
      const blob = await idb.get<Blob>('blobs', blobKey(row.project.id, slot.key))
      if (blob) slot.set(blobRegistry.put(slot.key, blob))
    }
    return project
  }
}
