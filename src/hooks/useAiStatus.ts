import { useEffect, useState } from 'react'
import { aiService, type AiStatus } from '@/services/ai/aiService'

/** Asks the server which AI capabilities are actually connected. `null` while loading. */
export function useAiStatus(): AiStatus | null {
  const [status, setStatus] = useState<AiStatus | null>(null)
  useEffect(() => {
    let active = true
    aiService.getStatus().then((s) => active && setStatus(s))
    return () => {
      active = false
    }
  }, [])
  return status
}
