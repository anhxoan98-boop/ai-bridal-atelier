import { useCallback, useRef, useState, type ChangeEvent } from 'react'
import { UPLOAD_LIMITS } from '@/config/env'
import { ImageUploadError, ingestImageFile } from '@/features/images/imageProcessing'
import { MESSAGES } from '@/lib/messages'
import type { ReferenceImage } from '@/types/design'

/**
 * Shared file-picking logic (click, drop, replace). Validates type, size and
 * real file signature; never trusts the file name.
 */
export function useImagePicker(onImage: (image: ReferenceImage) => void) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return
      setBusy(true)
      setError(null)
      try {
        const image = await ingestImageFile(file)
        onImage(image)
      } catch (err) {
        const reason = err instanceof ImageUploadError ? ` ${err.message}` : ''
        setError(`${MESSAGES.uploadFailed}${reason}`)
      } finally {
        setBusy(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [onImage],
  )

  const open = useCallback(() => inputRef.current?.click(), [])

  const inputProps = {
    ref: inputRef,
    type: 'file' as const,
    accept: UPLOAD_LIMITS.acceptAttribute,
    className: 'sr-only',
    tabIndex: -1,
    'aria-hidden': true,
    onChange: (e: ChangeEvent<HTMLInputElement>) => void handleFile(e.target.files?.[0]),
  }

  return { open, busy, error, setError, handleFile, inputProps }
}
