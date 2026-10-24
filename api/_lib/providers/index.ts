import type { AiProvider } from './types.js'

/**
 * Provider registry. Phase 1 ships with NO provider registered, so every AI
 * endpoint honestly answers "AI service not configured" (HTTP 503).
 *
 * To connect a provider later:
 *   1. Create e.g. api/_lib/providers/myProvider.ts implementing AiProvider
 *      (read the secret from process.env.AI_API_KEY — server side only).
 *   2. Add it to REGISTRY below: `myprovider: () => createMyProvider()`.
 *   3. Set AI_PROVIDER=myprovider and AI_API_KEY=... in Vercel env vars.
 */
const REGISTRY: Record<string, () => AiProvider> = {}

let cached: AiProvider | null | undefined

export function getProvider(): AiProvider | null {
  if (cached !== undefined) return cached
  const name = (process.env.AI_PROVIDER ?? '').trim().toLowerCase()
  const factory = name ? REGISTRY[name] : undefined
  cached = factory ? factory() : null
  return cached
}
