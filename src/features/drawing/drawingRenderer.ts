import type { DrawingPath, DrawingPoint } from '@/types/design'
import { isClosedLoop } from './drawingGeometry'

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

function averagePressure(points: DrawingPoint[]): number {
  if (points.length === 0) return 0.5
  return points.reduce((s, p) => s + p.pressure, 0) / points.length
}

/** Trace a smoothed polyline (quadratic curves through midpoints). */
function tracePath(ctx: Ctx, points: DrawingPoint[], width: number, height: number): void {
  const first = points[0]
  if (!first) return
  ctx.beginPath()
  ctx.moveTo(first.x * width, first.y * height)
  if (points.length === 1) {
    ctx.lineTo(first.x * width + 0.01, first.y * height + 0.01)
    return
  }
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i] as DrawingPoint
    const n = points[i + 1] as DrawingPoint
    ctx.quadraticCurveTo(p.x * width, p.y * height, ((p.x + n.x) / 2) * width, ((p.y + n.y) / 2) * height)
  }
  const last = points[points.length - 1] as DrawingPoint
  ctx.lineTo(last.x * width, last.y * height)
}

export function strokeWidthPx(path: DrawingPath, canvasWidth: number): number {
  // Pressure modulates width between 60% and 140% of the chosen size.
  const pressureFactor = 0.6 + averagePressure(path.points) * 0.8
  return Math.max(1, path.size * canvasWidth * pressureFactor)
}

/**
 * Render the customer's instruction layer onto a transparent canvas.
 * Erasers punch holes in earlier strokes; the dress image underneath is a
 * separate element and is never touched.
 */
export function renderDrawing(ctx: Ctx, paths: DrawingPath[], width: number, height: number): void {
  ctx.clearRect(0, 0, width, height)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const path of paths) {
    ctx.save()
    ctx.globalCompositeOperation = path.tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.globalAlpha = path.tool === 'eraser' ? 1 : path.opacity
    ctx.strokeStyle = path.tool === 'eraser' ? '#000' : path.color
    ctx.lineWidth = strokeWidthPx(path, width)
    tracePath(ctx, path.points, width, height)
    ctx.stroke()
    ctx.restore()
  }
}

/**
 * Build a binary edit mask at the image's natural resolution:
 * white = region the customer marked (change), black = preserve.
 * Closed outlines are filled so "draw around the flowers" marks the inside too.
 */
export function renderMask(ctx: Ctx, paths: DrawingPath[], width: number, height: number): void {
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const aspect = width / height
  for (const path of paths) {
    const color = path.tool === 'eraser' ? '#000' : '#fff'
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = strokeWidthPx(path, width)
    tracePath(ctx, path.points, width, height)
    if (path.tool === 'pen' && isClosedLoop(path, aspect)) {
      ctx.closePath()
      ctx.fill()
    }
    ctx.stroke()
  }
  ctx.restore()
}
