import { env } from '@/config/env'
import { supabase } from '@/lib/supabase'
import type { AiErrorCode, AiResult } from './types'

const NOT_CONFIGURED_MESSAGE =
  'AI service not configured. Connect an AI provider on the server to enable this step.'

async function authHeader(): Promise<Record<string, string>> {
  if (!supabase) return {}
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * POST to the server-side AI API. Never throws — always resolves to an
 * AiResult so callers must handle failure explicitly.
 */
export async function postAi<T>(action: string, body: unknown, signal?: AbortSignal): Promise<AiResult<T>> {
  let res: Response
  try {
    res = await fetch(`${env.aiApiBase}/ai/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(body),
      signal,
    })
  } catch {
    return { ok: false, code: 'NETWORK', message: 'Could not reach the design server. Please check your connection.' }
  }

  // No server functions running (e.g. plain `vite dev`) → treat as not configured.
  if (res.status === 404) {
    return { ok: false, code: 'AI_NOT_CONFIGURED', message: NOT_CONFIGURED_MESSAGE }
  }

  let payload: unknown = null
  try {
    payload = await res.json()
  } catch {
    payload = null
  }

  if (res.ok && isRecord(payload) && 'data' in payload) {
    return { ok: true, data: payload.data as T }
  }

  const code: AiErrorCode =
    isRecord(payload) && typeof payload.code === 'string'
      ? (payload.code as AiErrorCode)
      : res.status === 401
        ? 'UNAUTHORIZED'
        : res.status === 400
          ? 'BAD_REQUEST'
          : 'AI_FAILED'
  const message =
    code === 'AI_NOT_CONFIGURED'
      ? NOT_CONFIGURED_MESSAGE
      : isRecord(payload) && typeof payload.message === 'string'
        ? payload.message
        : 'The AI service returned an error.'
  return { ok: false, code, message }
}

export async function getAi<T>(action: string): Promise<AiResult<T>> {
  try {
    const res = await fetch(`${env.aiApiBase}/ai/${action}`, { headers: await authHeader() })
    if (res.status === 404) return { ok: false, code: 'AI_NOT_CONFIGURED', message: NOT_CONFIGURED_MESSAGE }
    const payload: unknown = await res.json().catch(() => null)
    if (res.ok && isRecord(payload) && 'data' in payload) return { ok: true, data: payload.data as T }
    return { ok: false, code: 'AI_FAILED', message: 'The AI service returned an error.' }
  } catch {
    return { ok: false, code: 'NETWORK', message: 'Could not reach the design server.' }
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}
