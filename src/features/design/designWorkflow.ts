import { createId, nowIso } from '@/lib/id'
import { MESSAGES } from '@/lib/messages'
import { blobRegistry } from '@/features/images/blobRegistry'
import { loadImageElement } from '@/features/images/imageProcessing'
import { currentVersion } from '@/features/versions/versionHistory'
import { aiService } from '@/services/ai/aiService'
import { toImagePayload } from '@/services/ai/imagePayload'
import type { AiErrorCode, GeneratedImageResult } from '@/services/ai/types'
import type { DesignRepository } from '@/services/db/designRepository'
import { designActions, getDesignState } from '@/state/designStore'
import type {
  ComponentType,
  DesignBrief,
  DesignProject,
  DrawingInstruction,
  GeneratedDesign,
  ReferenceImage,
} from '@/types/design'

export type WorkflowResult = { ok: true } | { ok: false; code: AiErrorCode | 'SAVE_FAILED'; message: string }

const fail = (code: AiErrorCode | 'SAVE_FAILED', message: string): WorkflowResult => ({ ok: false, code, message })

/**
 * Download an AI result into this session so it can be displayed and
 * persisted like any other image. Returns the blob key + object URL.
 */
async function importResultImage(result: GeneratedImageResult): Promise<{ key: string; url: string; width: number; height: number }> {
  const res = await fetch(result.imageUrl)
  if (!res.ok) throw new Error('Could not download the generated image')
  const blob = await res.blob()
  const key = createId()
  const url = blobRegistry.put(key, blob)
  const img = await loadImageElement(url)
  return { key, url, width: img.naturalWidth || result.width, height: img.naturalHeight || result.height }
}

/** Step: analyse every reference, then merge into one brief. */
export async function analyzeReferencesAndBrief(project: DesignProject): Promise<WorkflowResult> {
  if (!project.overallReference) return fail('BAD_REQUEST', 'Please add your overall vision image first.')

  let overallAnalysis = project.overallAnalysis
  if (!overallAnalysis) {
    const r = await aiService.analyzeOverallReference({
      image: await toImagePayload(project.overallReference),
      customerNote: project.overallInstruction,
    })
    if (!r.ok) return fail(r.code, r.message)
    overallAnalysis = r.data
    designActions.setOverallAnalysis(r.data)
  }

  const components = project.components.filter((c) => c.image)
  for (const c of components) {
    if (c.analysis || !c.image) continue
    const r = await aiService.analyzeComponentReference({
      componentType: c.type,
      image: await toImagePayload(c.image),
      customerNote: c.userInstruction,
      overallAnalysis,
    })
    if (!r.ok) return fail(r.code, r.message)
    designActions.setComponentAnalysis(c.type, r.data)
  }

  const latest = getDesignState().project
  const brief = await aiService.createDesignBrief({
    overallAnalysis: latest.overallAnalysis,
    overallNote: latest.overallInstruction,
    components: latest.components.map((c) => ({
      type: c.type,
      analysis: c.analysis,
      customerNote: c.userInstruction,
    })),
  })
  if (!brief.ok) return fail(brief.code, brief.message)
  designActions.setBrief({ ...brief.data, source: 'ai', updatedAt: nowIso() })
  return { ok: true }
}

/** Step: one cohesive dress from brief + references. Never overwrites the previous design on failure. */
export async function generateDesign(project: DesignProject): Promise<WorkflowResult> {
  if (!project.designBrief) return fail('BAD_REQUEST', 'Your design brief is empty.')
  try {
    const result = await aiService.generateDress({
      projectId: project.id,
      brief: project.designBrief,
      overallImage: project.overallReference ? await toImagePayload(project.overallReference, 1024) : undefined,
      componentImages: await Promise.all(
        project.components
          .filter((c): c is typeof c & { image: ReferenceImage } => Boolean(c.image))
          .map(async (c) => ({ type: c.type, image: await toImagePayload(c.image, 1024) })),
      ),
    })
    if (!result.ok) {
      return fail(result.code, result.code === 'AI_NOT_CONFIGURED' ? result.message : MESSAGES.aiFailed)
    }
    const imported = await importResultImage(result.data)
    const design: GeneratedDesign = {
      id: imported.key,
      projectId: project.id,
      imageUrl: imported.url,
      width: imported.width,
      height: imported.height,
      source: 'ai',
      provider: result.data.provider,
      promptSnapshot: result.data.promptSnapshot,
      createdAt: nowIso(),
    }
    designActions.setGeneratedDesign(design)
    return { ok: true }
  } catch {
    return fail('AI_FAILED', MESSAGES.aiFailed)
  }
}

/**
 * When AI is NOT configured, the customer can still walk through the
 * result/editor/save workflow using their own overall reference as a
 * clearly-labelled stand-in. It is never presented as an AI design.
 */
export function startReferencePreview(project: DesignProject): WorkflowResult {
  const ref = project.overallReference
  if (!ref) return fail('BAD_REQUEST', 'Please add your overall vision image first.')
  const key = createId()
  blobRegistry.alias(ref.id, key)
  const design: GeneratedDesign = {
    id: key,
    projectId: project.id,
    imageUrl: blobRegistry.urlFor(key) ?? ref.imageUrl,
    storagePath: blobRegistry.has(key) ? undefined : ref.storagePath,
    width: ref.width,
    height: ref.height,
    source: 'reference-preview',
    createdAt: nowIso(),
  }
  designActions.setGeneratedDesign(design)
  return { ok: true }
}

export type ApplyEditInput = {
  instruction: string
  drawing?: DrawingInstruction
  referenceImages: ReferenceImage[]
  targetArea?: ComponentType | 'whole-dress'
}

/** Localised AI edit. On success a NEW version is appended; on failure nothing changes. */
export async function applyEdit(input: ApplyEditInput): Promise<WorkflowResult> {
  const project = getDesignState().project
  const current = currentVersion(project.versions, project.currentVersionId)
  if (!current) return fail('BAD_REQUEST', 'There is no design to edit yet.')
  if (!input.instruction.trim() && !input.drawing) {
    return fail('BAD_REQUEST', 'Tell me what you would like to change, or draw on the dress.')
  }
  try {
    const editInput = await aiService.buildEditInput(
      {
        projectId: project.id,
        currentVersionId: current.id,
        currentImageUrl: current.imageUrl,
        instruction: input.instruction.trim(),
        drawing: input.drawing,
        referenceImages: input.referenceImages,
        targetArea: input.targetArea,
        designBrief: project.designBrief,
      },
      current,
    )
    const result = await aiService.editDress(editInput)
    if (!result.ok) {
      return fail(result.code, result.code === 'AI_NOT_CONFIGURED' ? result.message : MESSAGES.editFailed)
    }
    const imported = await importResultImage(result.data)
    designActions.addVersion(
      {
        imageUrl: imported.url,
        width: imported.width,
        height: imported.height,
        instruction: input.instruction.trim() || 'Edit from drawing',
        drawing: input.drawing,
        referenceImageIds: input.referenceImages.map((r) => r.id),
        parentVersionId: current.id,
      },
      imported.key,
    )
    return { ok: true }
  } catch {
    return fail('AI_FAILED', MESSAGES.editFailed)
  }
}

export async function saveCurrentProject(repo: DesignRepository): Promise<WorkflowResult> {
  const { project } = getDesignState()
  try {
    const saved = await repo.save(project)
    // Keep live URLs from the session; take storage paths from the saved copy.
    designActions.markSaved(mergeStoragePaths(getDesignState().project, saved))
    return { ok: true }
  } catch (err) {
    console.error('[save]', err)
    return fail('SAVE_FAILED', MESSAGES.saveFailed)
  }
}

function mergeStoragePaths(live: DesignProject, saved: DesignProject): DesignProject {
  const pathById = new Map<string, string | undefined>()
  const collect = (id: string, path?: string) => path && pathById.set(id, path)
  const imgs = [saved.overallReference, ...saved.components.map((c) => c.image), ...saved.editReferences]
  imgs.forEach((i) => {
    if (!i) return
    collect(i.id, i.storagePath)
    collect(`${i.id}:thumb`, i.thumbnailPath)
  })
  saved.versions.forEach((v) => collect(v.id, v.storagePath))
  if (saved.generatedDesign) collect(saved.generatedDesign.id, saved.generatedDesign.storagePath)

  const withPath = <T extends { id: string; storagePath?: string }>(x: T | undefined): T | undefined =>
    x ? { ...x, storagePath: x.storagePath ?? pathById.get(x.id) } : x
  const withImg = (i: ReferenceImage | undefined) =>
    i ? { ...withPath(i)!, thumbnailPath: i.thumbnailPath ?? pathById.get(`${i.id}:thumb`) } : i

  return {
    ...live,
    userId: saved.userId,
    overallReference: withImg(live.overallReference),
    components: live.components.map((c) => ({ ...c, image: withImg(c.image) })),
    editReferences: live.editReferences.map((r) => withImg(r)!),
    generatedDesign: withPath(live.generatedDesign),
    versions: live.versions.map((v) => withPath(v)!),
  }
}

/** Empty brief the customer can fill by hand when AI is not available. */
export function emptyBrief(): DesignBrief {
  return { source: 'customer', updatedAt: nowIso() }
}
