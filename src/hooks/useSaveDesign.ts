import { useState } from 'react'
import { saveCurrentProject } from '@/features/design/designWorkflow'
import { useRepository } from './useRepository'

export function useSaveDesign() {
  const repo = useRepository()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const save = async () => {
    setSaving(true)
    setMessage(null)
    const r = await saveCurrentProject(repo)
    setSaving(false)
    setMessage(
      r.ok
        ? {
            tone: 'success',
            text: repo.mode === 'cloud' ? 'Saved to My Designs.' : 'Saved to My Designs on this device.',
          }
        : { tone: 'error', text: r.message },
    )
    return r.ok
  }

  return { save, saving, message, clearMessage: () => setMessage(null), mode: repo.mode }
}
