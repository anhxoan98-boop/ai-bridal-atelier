import type {
  ComponentType,
  DesignBrief,
  DrawingInstruction,
  ImageMimeType,
  ReferenceAnalysis,
} from '@/types/design'
import type { DrawingRegionSummary } from '@/features/drawing/drawingModel'

/**
 * Provider-agnostic contract between the app and the server-side AI layer.
 * The UI only talks to these types; which model/vendor answers is decided in
 * /api (server) and can be swapped without touching the frontend.
 */

export type AiErrorCode = 'AI_NOT_CONFIGURED' | 'AI_FAILED' | 'NETWORK' | 'BAD_REQUEST' | 'UNAUTHORIZED'

export type AiResult<T> = { ok: true; data: T } | { ok: false; code: AiErrorCode; message: string }

export type AiCapabilities = {
  vision: boolean
  briefing: boolean
  generation: boolean
  editing: boolean
  video: boolean
}

export type AiStatus = {
  configured: boolean
  provider: string | null
  capabilities: AiCapabilities
  /** Human-readable explanation when not configured / unreachable. */
  reason?: string
}

/** How an image travels to the server. Prefer storagePath once uploads are persisted. */
export type ImagePayload = {
  id: string
  mimeType: ImageMimeType
  width: number
  height: number
  /** Downscaled data URL — used when the image only exists in this browser. */
  dataUrl?: string
  /** Private storage path — the server signs it with the service role. */
  storagePath?: string
}

export type AnalyzeOverallInput = {
  image: ImagePayload
  customerNote?: string
}

export type AnalyzeComponentInput = {
  componentType: ComponentType
  image: ImagePayload
  customerNote?: string
  /** Context so the model reads the part relative to the overall vision. */
  overallAnalysis?: ReferenceAnalysis
}

export type CreateBriefInput = {
  overallAnalysis?: ReferenceAnalysis
  overallNote?: string
  components: Array<{
    type: ComponentType
    analysis?: ReferenceAnalysis
    customerNote?: string
  }>
}

export type GenerateDressInput = {
  projectId: string
  brief: DesignBrief
  overallImage?: ImagePayload
  componentImages: Array<{ type: ComponentType; image: ImagePayload }>
}

export type GeneratedImageResult = {
  /** https URL or data URL of the produced image. */
  imageUrl: string
  width: number
  height: number
  provider: string
  promptSnapshot?: string
}

export type EditDressInput = {
  projectId: string
  currentVersionId: string
  currentImage: ImagePayload
  instruction: string
  drawing?: DrawingInstruction
  /** Black/white PNG — white marks the area to change. */
  maskDataUrl?: string
  region?: DrawingRegionSummary | null
  referenceImages: ImagePayload[]
  targetArea?: ComponentType | 'whole-dress'
  designBrief?: DesignBrief
}

export type AnalyzeDrawingInput = {
  currentImage: ImagePayload
  drawing: DrawingInstruction
  maskDataUrl: string
  instruction?: string
}

export type DrawingAnalysis = {
  /** Which part(s) of the dress the marked region covers, according to the model. */
  targetAreas: Array<ComponentType | 'whole-dress'>
  description: string
}
