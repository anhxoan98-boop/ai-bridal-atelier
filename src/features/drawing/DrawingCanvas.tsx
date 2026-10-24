import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { createId } from '@/lib/id'
import type { DrawingPath, DrawingPoint } from '@/types/design'
import { renderDrawing } from './drawingRenderer'
import { simplifyPoints } from './drawingGeometry'
import type { BrushSettings } from './drawingModel'

type Props = {
  paths: DrawingPath[]
  brush: BrushSettings
  enabled: boolean
  onCommit: (path: DrawingPath) => void
  className?: string
}

/**
 * Transparent canvas laid exactly over the design image. Works with mouse,
 * trackpad, touch and stylus through Pointer Events. Coordinates are stored
 * normalised (0..1) so the drawing survives resizes and maps 1:1 onto the
 * image's natural resolution when exported as a mask.
 */
export function DrawingCanvas({ paths, brush, enabled, onCommit, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef<{ pointerId: number; points: DrawingPoint[] } | null>(null)
  const sizeRef = useRef({ width: 0, height: 0 })
  const pathsRef = useRef(paths)
  const brushRef = useRef(brush)
  pathsRef.current = paths
  brushRef.current = brush

  const draw = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const { width, height } = sizeRef.current
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const active = activeRef.current
    const all = active ? [...pathsRef.current, makePath(active.points, brushRef.current)] : pathsRef.current
    renderDrawing(ctx, all, width, height)
  }

  // Keep the backing store matched to the displayed size (crisp on retina).
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      sizeRef.current = { width: rect.width, height: rect.height }
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      draw()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  useEffect(draw)

  const toPoint = (e: ReactPointerEvent<HTMLCanvasElement>): DrawingPoint => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      pressure: e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5,
    }
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!enabled || activeRef.current) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    activeRef.current = { pointerId: e.pointerId, points: [toPoint(e)] }
    draw()
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const active = activeRef.current
    if (!active || active.pointerId !== e.pointerId) return
    // Coalesced events give smoother lines from fast styluses.
    const events = typeof e.nativeEvent.getCoalescedEvents === 'function' ? e.nativeEvent.getCoalescedEvents() : []
    if (events.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect()
      for (const ce of events) {
        active.points.push({
          x: (ce.clientX - rect.left) / rect.width,
          y: (ce.clientY - rect.top) / rect.height,
          pressure: ce.pointerType === 'pen' && ce.pressure > 0 ? ce.pressure : 0.5,
        })
      }
    } else {
      active.points.push(toPoint(e))
    }
    draw()
  }

  const finish = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const active = activeRef.current
    if (!active || active.pointerId !== e.pointerId) return
    activeRef.current = null
    if (active.points.length > 0) {
      onCommit(makePath(simplifyPoints(active.points), brushRef.current))
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ touchAction: enabled ? 'none' : 'auto', cursor: enabled ? 'crosshair' : 'default' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      aria-label="Drawing layer over your dress design"
      role="img"
    />
  )
}

function makePath(points: DrawingPoint[], brush: BrushSettings): DrawingPath {
  return {
    id: createId(),
    tool: brush.tool,
    points,
    color: brush.color,
    size: brush.tool === 'eraser' ? brush.size * 2 : brush.size,
    opacity: brush.opacity,
  }
}
