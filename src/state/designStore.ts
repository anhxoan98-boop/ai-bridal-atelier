import { createId, nowIso } from '@/lib/id'
import { releaseImage } from '@/features/images/imageProcessing'
import { blobRegistry } from '@/features/images/blobRegistry'
import { appendVersion, versionFromGeneratedDesign, type NewVersionInput } from '@/features/versions/versionHistory'
import { CURRENT_DRAFT_ID, draftRepository } from '@/services/db/designRepository'
import type {
  ComponentReference,
  ComponentType,
  DesignBrief,
  DesignProject,
  GeneratedDesign,
  ReferenceAnalysis,
  ReferenceImage,
} from '@/types/design'
import { createStore } from './createStore'

export type DesignState = {
  project: DesignProject
  /** True when there are changes not yet saved to "My Designs". */
  dirty: boolean
  lastSavedAt?: string
  draftRestored: boolean
}

export function createEmptyProject(userId = 'local'): DesignProject {
  const now = nowIso()
  return {
    id: createId(),
    userId,
    title: 'My Bridal Design',
    status: 'draft',
    components: [],
    versions: [],
    editReferences: [],
    createdAt: now,
    updatedAt: now,
  }
}

const store = createStore<DesignState>({
  project: createEmptyProject(),
  dirty: false,
  draftRestored: false,
})

export const useDesignStore = store.useStore
export const getDesignState = store.getState

function update(mutator: (p: DesignProject) => DesignProject) {
  store.setState((s) => ({
    ...s,
    project: { ...mutator(s.project), updatedAt: nowIso() },
    dirty: true,
  }))
}

function upsertComponent(
  components: ComponentReference[],
  type: ComponentType,
  patch: (c: ComponentReference) => ComponentReference,
): ComponentReference[] {
  const existing = components.find((c) => c.type === type)
  if (existing) return components.map((c) => (c.type === type ? patch(c) : c))
  return [...components, patch({ id: createId(), type })]
}

export const designActions = {
  startNewProject(userId?: string) {
    store.setState({ project: createEmptyProject(userId), dirty: false, draftRestored: false })
  },

  loadProject(project: DesignProject) {
    store.setState({ project, dirty: false, lastSavedAt: project.updatedAt, draftRestored: false })
  },

  setTitle(title: string) {
    update((p) => ({ ...p, title: title.trim() || 'My Bridal Design' }))
  },

  setOverallReference(image: ReferenceImage | undefined) {
    update((p) => {
      if (p.overallReference && p.overallReference.id !== image?.id) releaseImage(p.overallReference)
      return { ...p, overallReference: image, overallAnalysis: undefined }
    })
  },

  setOverallInstruction(text: string) {
    update((p) => ({ ...p, overallInstruction: text }))
  },

  setOverallAnalysis(analysis: ReferenceAnalysis) {
    update((p) => ({ ...p, overallAnalysis: analysis }))
  },

  setComponentImage(type: ComponentType, image: ReferenceImage | undefined) {
    update((p) => ({
      ...p,
      components: upsertComponent(p.components, type, (c) => {
        if (c.image && c.image.id !== image?.id) releaseImage(c.image)
        return { ...c, image, analysis: undefined }
      }),
    }))
  },

  setComponentInstruction(type: ComponentType, text: string) {
    update((p) => ({
      ...p,
      components: upsertComponent(p.components, type, (c) => ({ ...c, userInstruction: text })),
    }))
  },

  setComponentAnalysis(type: ComponentType, analysis: ReferenceAnalysis) {
    update((p) => ({
      ...p,
      components: upsertComponent(p.components, type, (c) => ({ ...c, analysis })),
    }))
  },

  setBrief(brief: DesignBrief) {
    update((p) => ({ ...p, designBrief: brief }))
  },

  /**
   * A new full design (from the brief). The first one becomes Version 1;
   * a later regeneration is appended as a new version — nothing is lost.
   */
  setGeneratedDesign(design: GeneratedDesign) {
    update((p) => {
      if (p.versions.length === 0) {
        const v1 = versionFromGeneratedDesign(design)
        blobRegistry.alias(design.id, v1.id)
        return { ...p, generatedDesign: design, versions: [v1], currentVersionId: v1.id, status: 'designed' }
      }
      const versions = appendVersion(p.versions, p.id, {
        imageUrl: design.imageUrl,
        storagePath: design.storagePath,
        width: design.width,
        height: design.height,
        instruction: 'New design from brief',
        parentVersionId: p.currentVersionId ?? (p.versions[p.versions.length - 1]?.id as string),
      })
      const last = versions[versions.length - 1]
      if (last) {
        last.source = design.source
        blobRegistry.alias(design.id, last.id)
      }
      return { ...p, generatedDesign: design, versions, currentVersionId: last?.id, status: 'designed' }
    })
    return store.getState().project
  },

  /**
   * Append an edited version and show it. `blobKey` is where the new image
   * bytes were registered, so they can be persisted under the version id.
   */
  addVersion(input: NewVersionInput, blobKey?: string): string | undefined {
    let newId: string | undefined
    update((p) => {
      const versions = appendVersion(p.versions, p.id, input)
      newId = versions[versions.length - 1]?.id
      if (blobKey && newId) blobRegistry.alias(blobKey, newId)
      return { ...p, versions, currentVersionId: newId }
    })
    return newId
  },

  setCurrentVersion(versionId: string | undefined) {
    if (!versionId) return
    update((p) => (p.versions.some((v) => v.id === versionId) ? { ...p, currentVersionId: versionId } : p))
  },

  addEditReference(image: ReferenceImage) {
    update((p) => ({ ...p, editReferences: [...p.editReferences, image] }))
  },

  removeEditReference(imageId: string) {
    update((p) => ({ ...p, editReferences: p.editReferences.filter((r) => r.id !== imageId) }))
  },

  markSaved(project: DesignProject) {
    store.setState((s) => ({ ...s, project, dirty: false, lastSavedAt: nowIso() }))
  },
}

// ── Draft autosave: never lose the customer's work ───────────

let saveTimer: ReturnType<typeof setTimeout> | undefined
let lastSavedProject: DesignProject | undefined

store.subscribe(() => {
  const { project } = store.getState()
  if (project === lastSavedProject) return
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    lastSavedProject = project
    draftRepository.save(project, CURRENT_DRAFT_ID).catch((err: unknown) => {
      console.warn('[draft] autosave failed', err)
    })
  }, 700)
})

/** Restore the last in-progress design after a refresh or crash. */
export async function restoreDraft(): Promise<void> {
  try {
    const draft = await draftRepository.loadSlot(CURRENT_DRAFT_ID)
    if (draft && store.getState().project.versions.length === 0 && !store.getState().dirty) {
      lastSavedProject = draft
      store.setState({ project: draft, dirty: true, draftRestored: true })
    }
  } catch (err) {
    console.warn('[draft] restore failed', err)
  }
}
