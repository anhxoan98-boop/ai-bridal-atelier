import { UPLOAD_LIMITS } from '@/config/env'
import { createId, nowIso } from '@/lib/id'
import type { ReferenceImage } from '@/types/design'
import { blobRegistry, thumbKey } from './blobRegistry'
import { validateImageFile } from './imageValidation'

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageUploadError'
  }
}

export async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new ImageUploadError('This image could not be read.'))
    img.src = src
  })
}

/** Downscaled preview for grids/lists. The original is always kept untouched. */
export async function createThumbnail(
  img: HTMLImageElement,
  maxSide: number = UPLOAD_LIMITS.thumbnailMaxSide,
): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ImageUploadError('Your browser could not prepare a preview.')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, w, h)
  return canvasToBlob(canvas, 'image/webp', 0.82)
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new ImageUploadError('Could not encode image.'))),
      type,
      quality,
    )
  })
}

/**
 * Validates a user file and turns it into a ReferenceImage held in this
 * browser session. The original bytes are kept as-is (no crop, no resize).
 * The user-provided file name is ignored on purpose.
 */
export async function ingestImageFile(file: File | Blob): Promise<ReferenceImage> {
  const validation = await validateImageFile(file)
  if (!validation.ok) throw new ImageUploadError(validation.reason)

  const id = createId()
  // Re-wrap with the sniffed type so the stored blob never carries a spoofed type.
  const original = new Blob([file], { type: validation.mimeType })
  const imageUrl = blobRegistry.put(id, original)

  let img: HTMLImageElement
  try {
    img = await loadImageElement(imageUrl)
  } catch (err) {
    blobRegistry.release(id)
    throw err
  }

  if (img.naturalWidth > UPLOAD_LIMITS.maxDimension || img.naturalHeight > UPLOAD_LIMITS.maxDimension) {
    blobRegistry.release(id)
    throw new ImageUploadError(
      `This image is very large (over ${UPLOAD_LIMITS.maxDimension}px). Please choose a smaller one.`,
    )
  }

  const thumb = await createThumbnail(img)
  const thumbnailUrl = blobRegistry.put(thumbKey(id), thumb)

  return {
    id,
    imageUrl,
    thumbnailUrl,
    mimeType: validation.mimeType,
    width: img.naturalWidth,
    height: img.naturalHeight,
    sizeBytes: original.size,
    createdAt: nowIso(),
  }
}

export function releaseImage(image: ReferenceImage | undefined): void {
  if (!image) return
  blobRegistry.release(image.id)
  blobRegistry.release(thumbKey(image.id))
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(blob)
  })
}
