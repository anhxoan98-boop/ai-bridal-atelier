import { createId } from '@/lib/id'
import type { DrawingInstruction, DrawingPath, DrawingTool } from '@/types/design'
import { pathBounds, guessDressZone, type NormalizedBox } from './drawingGeometry'

export type BrushSettings = {
  tool: DrawingTool
  color: string
  /** Fraction of image width (0.004 – 0.08). */
  size: number
  opacity: number
}

export const DEFAULT_BRUSH: BrushSettings = {
  tool: 'pen',
  color: '#c2410c',
  size: 0.012,
  opacity: 0.85,
}

export const BRUSH_COLORS = ['#c2410c', '#be185d', '#1d4ed8', '#15803d', '#111827'] as const

export function toDrawingInstruction(
  paths: DrawingPath[],
  brush: BrushSettings,
  imageWidth: number,
  imageHeight: number,
): DrawingInstruction | undefined {
  if (!hasVisibleStrokes(paths)) return undefined
  return {
    id: createId(),
    paths,
    color: brush.color,
    brushSize: brush.size,
    imageWidth,
    imageHeight,
  }
}

export function hasVisibleStrokes(paths: DrawingPath[]): boolean {
  return paths.some((p) => p.tool === 'pen' && p.points.length > 0)
}

/** Local, deterministic summary of what was drawn — sent alongside the mask to the AI. */
export type DrawingRegionSummary = {
  strokeCount: number
  bounds: NormalizedBox
  zone: 'upper' | 'middle' | 'lower'
}

export function summarizeDrawing(drawing: DrawingInstruction): DrawingRegionSummary | null {
  const bounds = pathBounds(drawing.paths)
  if (!bounds) return null
  return {
    strokeCount: drawing.paths.filter((p) => p.tool === 'pen').length,
    bounds,
    zone: guessDressZone(bounds),
  }
}
