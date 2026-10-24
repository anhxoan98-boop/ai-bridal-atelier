import { createId, nowIso } from '@/lib/id'
import type { DesignVersion, DrawingInstruction, GeneratedDesign } from '@/types/design'

/**
 * Version rules:
 * - Every successful AI edit APPENDS a new version. Nothing is ever removed.
 * - Undo / redo move the "current" pointer through the chronological list.
 * - Restore jumps the pointer to any version.
 * - Editing from an older version appends a new version whose parent is that
 *   older version — later versions remain available.
 */

export function versionFromGeneratedDesign(design: GeneratedDesign): DesignVersion {
  return {
    id: createId(),
    projectId: design.projectId,
    versionNumber: 1,
    imageUrl: design.imageUrl,
    storagePath: design.storagePath,
    width: design.width,
    height: design.height,
    source: design.source,
    instruction: 'Original design',
    parentVersionId: null,
    createdAt: nowIso(),
  }
}

export type NewVersionInput = {
  imageUrl: string
  storagePath?: string
  width: number
  height: number
  instruction: string
  drawing?: DrawingInstruction
  referenceImageIds?: string[]
  parentVersionId: string
}

export function appendVersion(versions: DesignVersion[], projectId: string, input: NewVersionInput): DesignVersion[] {
  const nextNumber = versions.reduce((max, v) => Math.max(max, v.versionNumber), 0) + 1
  const version: DesignVersion = {
    id: createId(),
    projectId,
    versionNumber: nextNumber,
    source: 'ai',
    createdAt: nowIso(),
    ...input,
  }
  return [...versions, version]
}

function indexOf(versions: DesignVersion[], id: string | undefined): number {
  if (!id) return versions.length - 1
  const i = versions.findIndex((v) => v.id === id)
  return i === -1 ? versions.length - 1 : i
}

export function currentVersion(versions: DesignVersion[], currentId: string | undefined): DesignVersion | undefined {
  return versions[indexOf(versions, currentId)]
}

export function canUndoVersion(versions: DesignVersion[], currentId: string | undefined): boolean {
  return indexOf(versions, currentId) > 0
}

export function canRedoVersion(versions: DesignVersion[], currentId: string | undefined): boolean {
  const i = indexOf(versions, currentId)
  return i >= 0 && i < versions.length - 1
}

export function undoVersion(versions: DesignVersion[], currentId: string | undefined): string | undefined {
  const i = indexOf(versions, currentId)
  return i > 0 ? versions[i - 1]?.id : versions[i]?.id
}

export function redoVersion(versions: DesignVersion[], currentId: string | undefined): string | undefined {
  const i = indexOf(versions, currentId)
  return i < versions.length - 1 ? versions[i + 1]?.id : versions[i]?.id
}
