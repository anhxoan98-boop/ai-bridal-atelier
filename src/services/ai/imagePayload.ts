import { blobRegistry } from '@/features/images/blobRegistry'
import { blobToDataUrl, canvasToBlob, loadImageElement } from '@/features/images/imageProcessing'
import type { ImagePayload } from './types'

type ImageLike = {
  id: string
  imageUrl: string
  storagePath?: string
  mimeType?: ImagePayload['mimeType']
  width: number
  height: number
}

/**
 * Prepare an image for the AI server. If it is already in private storage we
 * only send the path. Otherwise we send a downscaled JPEG data URL to stay
 * well under serverless body limits (the original is untouched).
 */
export async function toImagePayload(image: ImageLike, maxSide = 1536): Promise<ImagePayload> {
  const base = {
    id: image.id,
    mimeType: image.mimeType ?? 'image/jpeg',
    width: image.width,
    height: image.height,
  } satisfies Omit<ImagePayload, 'dataUrl' | 'storagePath'>

  if (image.storagePath) return { ...base, storagePath: image.storagePath }

  const src = blobRegistry.urlFor(image.id) ?? image.imageUrl
  const img = await loadImageElement(src)
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
  if (scale === 1 && blobRegistry.get(image.id) && (blobRegistry.get(image.id)?.size ?? 0) < 1_500_000) {
    return { ...base, dataUrl: await blobToDataUrl(blobRegistry.get(image.id) as Blob) }
  }
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.88)
  return { ...base, mimeType: 'image/jpeg', dataUrl: await blobToDataUrl(blob) }
}
