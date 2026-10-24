import { getAi } from './httpClient'
import { editingService } from './editingService'
import { imageGenerationService } from './imageGenerationService'
import { visionService } from './visionService'
import type { AiResult, AiStatus } from './types'

const NOT_CONFIGURED: AiStatus = {
  configured: false,
  provider: null,
  capabilities: { vision: false, briefing: false, generation: false, editing: false, video: false },
  reason: 'AI service not configured.',
}

let statusCache: Promise<AiStatus> | null = null

/**
 * Single entry point the UI uses. Provider-agnostic: every call goes to the
 * server (/api/ai/*), which holds the secret keys and the chosen adapter.
 */
export const aiService = {
  getStatus(force = false): Promise<AiStatus> {
    if (!statusCache || force) {
      statusCache = getAi<AiStatus>('status').then((r: AiResult<AiStatus>) =>
        r.ok ? r.data : { ...NOT_CONFIGURED, reason: r.message },
      )
    }
    return statusCache
  },

  analyzeOverallReference: visionService.analyzeOverallReference,
  analyzeComponentReference: visionService.analyzeComponentReference,
  createDesignBrief: visionService.createDesignBrief,
  generateDress: imageGenerationService.generateDress,
  makeItReal: imageGenerationService.makeItReal,
  createVideo: imageGenerationService.createVideo,
  buildEditInput: editingService.buildEditInput,
  editDress: editingService.editDress,
  analyzeDrawing: editingService.analyzeDrawing,
}

export type { AiStatus } from './types'
