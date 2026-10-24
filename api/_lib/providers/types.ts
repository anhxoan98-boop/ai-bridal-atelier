/**
 * Server-side AI provider contract. Implement this for any vendor
 * (vision LLM + image model + inpainting model) and register it in
 * ./index.ts. The frontend never knows which provider is used.
 *
 * Inputs/outputs mirror src/services/ai/types.ts (kept as loose JSON here
 * because they arrive over HTTP and are validated per action).
 */
export type Json = Record<string, unknown>

export type ProviderCapabilities = {
  vision: boolean
  briefing: boolean
  generation: boolean
  editing: boolean
  video: boolean
}

export type ProviderContext = { userId: string | null }

export interface AiProvider {
  readonly name: string
  readonly capabilities: ProviderCapabilities

  /** Overall reference → silhouette, proportions, style, mood, construction. */
  analyzeOverallReference?(input: Json, ctx: ProviderContext): Promise<Json>
  /** One component reference, read relative to the overall vision. */
  analyzeComponentReference?(input: Json, ctx: ProviderContext): Promise<Json>
  /** Merge analyses into ONE coherent DesignBrief. */
  createDesignBrief?(input: Json, ctx: ProviderContext): Promise<Json>
  /** One cohesive dress image. Returns { imageUrl, width, height, provider, promptSnapshot }. */
  generateDress?(input: Json, ctx: ProviderContext): Promise<Json>
  /**
   * Localised edit. Use `maskDataUrl` (white = change) for inpainting when
   * present; otherwise instruction-based editing that preserves all parts
   * not mentioned. Returns the same shape as generateDress.
   */
  editDress?(input: Json, ctx: ProviderContext): Promise<Json>
  analyzeDrawing?(input: Json, ctx: ProviderContext): Promise<Json>
  makeItReal?(input: Json, ctx: ProviderContext): Promise<Json>
  createVideo?(input: Json, ctx: ProviderContext): Promise<Json>
}
