import type { DesignBrief, ReferenceAnalysis } from '@/types/design'
import { postAi } from './httpClient'
import type { AiResult, AnalyzeComponentInput, AnalyzeOverallInput, CreateBriefInput } from './types'

/**
 * Understanding the customer's references.
 * - Overall reference → silhouette, proportions, style, mood, construction.
 * - Component reference → only the specific part (bodice, skirt, …), read in
 *   the context of the overall vision.
 */
export const visionService = {
  analyzeOverallReference(input: AnalyzeOverallInput, signal?: AbortSignal): Promise<AiResult<ReferenceAnalysis>> {
    return postAi<ReferenceAnalysis>('analyze-overall', input, signal)
  },

  analyzeComponentReference(
    input: AnalyzeComponentInput,
    signal?: AbortSignal,
  ): Promise<AiResult<ReferenceAnalysis>> {
    return postAi<ReferenceAnalysis>('analyze-component', input, signal)
  },

  /** Merge all analyses into ONE coherent brief (not a collage of parts). */
  createDesignBrief(input: CreateBriefInput, signal?: AbortSignal): Promise<AiResult<DesignBrief>> {
    return postAi<DesignBrief>('create-brief', input, signal)
  },
}
