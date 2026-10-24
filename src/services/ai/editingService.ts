import { summarizeDrawing } from '@/features/drawing/drawingModel'
import { exportMaskDataUrl } from '@/features/drawing/maskExport'
import type { DressEditRequest } from '@/types/design'
import { postAi } from './httpClient'
import { toImagePayload } from './imagePayload'
import type { AiResult, AnalyzeDrawingInput, DrawingAnalysis, EditDressInput, GeneratedImageResult } from './types'

/**
 * Localised editing.
 * The request always carries: current image, instruction, optional drawing
 * (+ rasterised mask and region summary), optional new references and the
 * current brief, so the model can change ONLY what was asked and preserve
 * everything else.
 */
export const editingService = {
  async buildEditInput(req: DressEditRequest, currentImage: {
    id: string
    imageUrl: string
    storagePath?: string
    width: number
    height: number
  }): Promise<EditDressInput> {
    const maskDataUrl = req.maskDataUrl ?? (req.drawing ? exportMaskDataUrl(req.drawing) : undefined)
    return {
      projectId: req.projectId,
      currentVersionId: req.currentVersionId,
      currentImage: await toImagePayload(currentImage),
      instruction: req.instruction,
      drawing: req.drawing,
      maskDataUrl,
      region: req.drawing ? summarizeDrawing(req.drawing) : null,
      referenceImages: await Promise.all((req.referenceImages ?? []).map((r) => toImagePayload(r, 1024))),
      targetArea: req.targetArea,
      designBrief: req.designBrief,
    }
  },

  editDress(input: EditDressInput, signal?: AbortSignal): Promise<AiResult<GeneratedImageResult>> {
    return postAi<GeneratedImageResult>('edit', input, signal)
  },

  analyzeDrawing(input: AnalyzeDrawingInput, signal?: AbortSignal): Promise<AiResult<DrawingAnalysis>> {
    return postAi<DrawingAnalysis>('analyze-drawing', input, signal)
  },
}
