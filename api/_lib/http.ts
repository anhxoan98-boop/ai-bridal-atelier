export type ApiErrorCode = 'AI_NOT_CONFIGURED' | 'AI_FAILED' | 'BAD_REQUEST' | 'UNAUTHORIZED' | 'NOT_FOUND'

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ data }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export function fail(code: ApiErrorCode, message: string, status: number): Response {
  return Response.json({ code, message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export const notConfigured = () =>
  fail('AI_NOT_CONFIGURED', 'AI service not configured.', 503)

/** Max JSON body we accept (Vercel's own limit is ~4.5 MB). */
export const MAX_BODY_BYTES = 4 * 1024 * 1024

export async function readJson(request: Request): Promise<unknown> {
  const length = Number(request.headers.get('content-length') ?? '0')
  if (length > MAX_BODY_BYTES) throw new BodyError('Request is too large.')
  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) throw new BodyError('Request is too large.')
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new BodyError('Invalid JSON body.')
  }
}

export class BodyError extends Error {}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
