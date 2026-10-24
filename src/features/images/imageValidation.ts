import { UPLOAD_LIMITS } from '@/config/env'
import type { ImageMimeType } from '@/types/design'

export type ValidationResult =
  | { ok: true; mimeType: ImageMimeType }
  | { ok: false; reason: string }

/**
 * Detect the real image type from the first bytes of the file.
 * We never trust the file name or the browser-reported MIME type alone.
 */
export function sniffImageType(bytes: Uint8Array): ImageMimeType | null {
  const b = (i: number) => bytes[i] ?? -1
  // JPEG: FF D8 FF
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return 'image/jpeg'
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47 &&
    b(4) === 0x0d && b(5) === 0x0a && b(6) === 0x1a && b(7) === 0x0a
  ) {
    return 'image/png'
  }
  // WEBP: "RIFF" .... "WEBP"
  if (
    b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 &&
    b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50
  ) {
    return 'image/webp'
  }
  return null
}

export function validateImageHeader(
  header: Uint8Array,
  sizeBytes: number,
  maxBytes: number = UPLOAD_LIMITS.maxBytes,
): ValidationResult {
  if (sizeBytes <= 0) return { ok: false, reason: 'This file is empty.' }
  if (sizeBytes > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024))
    return { ok: false, reason: `This image is larger than ${mb} MB. Please choose a smaller file.` }
  }
  const mimeType = sniffImageType(header)
  if (!mimeType) {
    return { ok: false, reason: 'Please upload a JPG, PNG or WEBP image.' }
  }
  return { ok: true, mimeType }
}

export async function validateImageFile(file: Blob): Promise<ValidationResult> {
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  return validateImageHeader(header, file.size)
}

export function extensionFor(mime: ImageMimeType): 'jpg' | 'png' | 'webp' {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
  }
}
