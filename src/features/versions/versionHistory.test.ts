import { describe, expect, it } from 'vitest'
import type { GeneratedDesign } from '@/types/design'
import {
  appendVersion,
  canRedoVersion,
  canUndoVersion,
  currentVersion,
  redoVersion,
  undoVersion,
  versionFromGeneratedDesign,
} from './versionHistory'

const design: GeneratedDesign = {
  id: 'g1',
  projectId: 'p1',
  imageUrl: 'blob:1',
  width: 800,
  height: 1200,
  source: 'ai',
  createdAt: '2026-01-01T00:00:00.000Z',
}

function threeVersions() {
  const v1 = versionFromGeneratedDesign(design)
  let versions = [v1]
  versions = appendVersion(versions, 'p1', { imageUrl: 'blob:2', width: 800, height: 1200, instruction: 'Added sleeves', parentVersionId: v1.id })
  versions = appendVersion(versions, 'p1', { imageUrl: 'blob:3', width: 800, height: 1200, instruction: 'Changed skirt', parentVersionId: versions[1]!.id })
  return versions
}

describe('design versions', () => {
  it('starts with "Original design" as version 1', () => {
    const v1 = versionFromGeneratedDesign(design)
    expect(v1.versionNumber).toBe(1)
    expect(v1.instruction).toBe('Original design')
    expect(v1.parentVersionId).toBeNull()
  })

  it('appends versions with increasing numbers and never removes any', () => {
    const versions = threeVersions()
    expect(versions.map((v) => v.versionNumber)).toEqual([1, 2, 3])
    expect(versions.map((v) => v.instruction)).toEqual(['Original design', 'Added sleeves', 'Changed skirt'])
  })

  it('undo / redo move the current pointer without deleting', () => {
    const versions = threeVersions()
    let current: string | undefined = versions[2]!.id
    expect(canRedoVersion(versions, current)).toBe(false)
    current = undoVersion(versions, current)
    current = undoVersion(versions, current)
    expect(currentVersion(versions, current)?.versionNumber).toBe(1)
    expect(canUndoVersion(versions, current)).toBe(false)
    current = redoVersion(versions, current)
    expect(currentVersion(versions, current)?.versionNumber).toBe(2)
    expect(versions).toHaveLength(3)
  })

  it('editing from an older version appends, keeping later versions', () => {
    const versions = threeVersions()
    const fromV1 = appendVersion(versions, 'p1', {
      imageUrl: 'blob:4',
      width: 800,
      height: 1200,
      instruction: 'Added lace',
      parentVersionId: versions[0]!.id,
    })
    expect(fromV1).toHaveLength(4)
    expect(fromV1[3]!.versionNumber).toBe(4)
    expect(fromV1[3]!.parentVersionId).toBe(versions[0]!.id)
  })
})
