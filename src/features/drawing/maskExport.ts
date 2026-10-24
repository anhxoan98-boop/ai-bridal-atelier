import type { DrawingInstruction } from '@/types/design'
import { renderMask } from './drawingRenderer'

/**
 * Rasterise the drawing into a black/white PNG mask at the design's natural
 * resolution. This is what an inpainting model needs for localised edits.
 */
export function exportMaskDataUrl(drawing: DrawingInstruction, maxSide = 2048): string {
  const scale = Math.min(1, maxSide / Math.max(drawing.imageWidth, drawing.imageHeight))
  const w = Math.max(1, Math.round(drawing.imageWidth * scale))
  const h = Math.max(1, Math.round(drawing.imageHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  renderMask(ctx, drawing.paths, w, h)
  return canvas.toDataURL('image/png')
}
