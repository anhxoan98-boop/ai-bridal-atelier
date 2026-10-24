import type { DrawingPath, DrawingPoint } from '@/types/design'

export type NormalizedBox = { x: number; y: number; width: number; height: number }

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** A pen stroke that ends near where it started is treated as an outline ("draw around this"). */
export function isClosedLoop(path: DrawingPath, aspect = 1, threshold = 0.06): boolean {
  if (path.points.length < 8) return false
  const first = path.points[0] as DrawingPoint
  const last = path.points[path.points.length - 1] as DrawingPoint
  const dx = (last.x - first.x) * aspect
  const dy = last.y - first.y
  const gap = Math.hypot(dx, dy)
  const box = pathBounds([path])
  if (!box) return false
  const extent = Math.max(box.width * aspect, box.height)
  return gap < Math.max(threshold, extent * 0.25) && extent > gap * 2
}

/** Bounding box (normalised) of all pen strokes, padded by brush size. Erasers are ignored. */
export function pathBounds(paths: DrawingPath[]): NormalizedBox | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of paths) {
    if (p.tool !== 'pen') continue
    const pad = p.size / 2
    for (const pt of p.points) {
      minX = Math.min(minX, pt.x - pad)
      minY = Math.min(minY, pt.y - pad)
      maxX = Math.max(maxX, pt.x + pad)
      maxY = Math.max(maxY, pt.y + pad)
    }
  }
  if (!Number.isFinite(minX)) return null
  const x = clamp01(minX)
  const y = clamp01(minY)
  return { x, y, width: clamp01(maxX) - x, height: clamp01(maxY) - y }
}

/**
 * Rough vertical zone of the dress a box falls in — a hint for the AI, not a
 * decision. Assumes a full-length, front-facing dress image.
 */
export function guessDressZone(box: NormalizedBox): 'upper' | 'middle' | 'lower' {
  const cy = box.y + box.height / 2
  if (cy < 0.38) return 'upper'
  if (cy < 0.62) return 'middle'
  return 'lower'
}

/** Drop points closer than `minDistance` to the previous kept point (keeps data small). */
export function simplifyPoints(points: DrawingPoint[], minDistance = 0.0015): DrawingPoint[] {
  if (points.length <= 2) return points
  const out: DrawingPoint[] = [points[0] as DrawingPoint]
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i] as DrawingPoint
    const prev = out[out.length - 1] as DrawingPoint
    if (Math.hypot(p.x - prev.x, p.y - prev.y) >= minDistance) out.push(p)
  }
  out.push(points[points.length - 1] as DrawingPoint)
  return out
}
