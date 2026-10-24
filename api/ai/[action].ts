import { authenticate } from '../_lib/auth.js'
import { BodyError, fail, isRecord, notConfigured, ok, readJson } from '../_lib/http.js'
import { getProvider } from '../_lib/providers/index.js'
import type { AiProvider, Json, ProviderCapabilities } from '../_lib/providers/types.js'
import { validateAction } from '../_lib/validate.js'

/**
 * Vercel Function: /api/ai/:action
 * All AI work happens here, server-side, so API keys never reach the browser.
 */

type Method = keyof Pick<
  AiProvider,
  | 'analyzeOverallReference'
  | 'analyzeComponentReference'
  | 'createDesignBrief'
  | 'generateDress'
  | 'editDress'
  | 'analyzeDrawing'
  | 'makeItReal'
  | 'createVideo'
>

const ACTIONS: Record<string, Method> = {
  'analyze-overall': 'analyzeOverallReference',
  'analyze-component': 'analyzeComponentReference',
  'create-brief': 'createDesignBrief',
  generate: 'generateDress',
  edit: 'editDress',
  'analyze-drawing': 'analyzeDrawing',
  'make-it-real': 'makeItReal',
  'create-video': 'createVideo',
}

const NO_CAPABILITIES: ProviderCapabilities = {
  vision: false,
  briefing: false,
  generation: false,
  editing: false,
  video: false,
}

function actionFrom(request: Request): string {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean)
  return parts[parts.length - 1] ?? ''
}

export async function GET(request: Request): Promise<Response> {
  if (actionFrom(request) !== 'status') return fail('NOT_FOUND', 'Not found.', 404)
  const provider = getProvider()
  return ok({
    configured: provider !== null,
    provider: provider?.name ?? null,
    capabilities: provider?.capabilities ?? NO_CAPABILITIES,
    reason: provider ? undefined : 'AI service not configured.',
  })
}

export async function POST(request: Request): Promise<Response> {
  const action = actionFrom(request)
  const method = ACTIONS[action]
  if (!method) return fail('NOT_FOUND', 'Unknown AI action.', 404)

  const caller = await authenticate(request)
  if (!caller) return fail('UNAUTHORIZED', 'Please log in again.', 401)

  const provider = getProvider()
  const handler = provider?.[method]
  if (!provider || !handler) return notConfigured()

  let body: unknown
  try {
    body = await readJson(request)
  } catch (err) {
    return fail('BAD_REQUEST', err instanceof BodyError ? err.message : 'Invalid request.', 400)
  }
  const invalid = validateAction(action, body)
  if (invalid) return fail('BAD_REQUEST', invalid, 400)

  try {
    const result = await handler.call(provider, body as Json, { userId: caller.userId })
    if (!isRecord(result)) throw new Error('Provider returned an invalid result')
    return ok(result)
  } catch (err) {
    console.error(`[ai/${action}]`, err)
    return fail('AI_FAILED', 'The AI service could not complete this request.', 502)
  }
}
