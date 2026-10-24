import { postAi } from './httpClient'
import type { AiResult, GenerateDressInput, GeneratedImageResult, ImagePayload } from './types'

export type MakeItRealInput = { projectId: string; versionId: string; design: ImagePayload }
export type CreateVideoInput = { projectId: string; versionId: string; designs: ImagePayload[] }
export type VideoJob = { jobId: string; status: 'queued' | 'processing' | 'done' | 'failed'; videoUrl?: string }

export const imageGenerationService = {
  /** One cohesive dress from the brief + references. */
  generateDress(input: GenerateDressInput, signal?: AbortSignal): Promise<AiResult<GeneratedImageResult>> {
    return postAi<GeneratedImageResult>('generate', input, signal)
  },

  /** FUTURE: photorealistic bridal image from the approved design (design stays the source of truth). */
  makeItReal(input: MakeItRealInput, signal?: AbortSignal): Promise<AiResult<GeneratedImageResult>> {
    return postAi<GeneratedImageResult>('make-it-real', input, signal)
  },

  /** FUTURE: AI video using approved design images as references. */
  createVideo(input: CreateVideoInput, signal?: AbortSignal): Promise<AiResult<VideoJob>> {
    return postAi<VideoJob>('create-video', input, signal)
  },
}
