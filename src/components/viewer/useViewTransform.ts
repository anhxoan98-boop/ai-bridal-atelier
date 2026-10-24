import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

export type ViewTransform = { scale: number; rotation: number; x: number; y: number }

const MIN_SCALE = 0.05
const MAX_SCALE = 8

/**
 * Zoom / pan / rotate state for viewing a full, uncropped image.
 * "Fit" always shows the whole image inside the container (contain).
 */
export function useViewTransform(
  containerRef: RefObject<HTMLElement | null>,
  naturalWidth: number,
  naturalHeight: number,
) {
  const [t, setT] = useState<ViewTransform>({ scale: 1, rotation: 0, x: 0, y: 0 })
  const fitScaleRef = useRef(1)

  const computeFit = useCallback(
    (rotation: number) => {
      const el = containerRef.current
      if (!el || !naturalWidth || !naturalHeight) return 1
      const rotated = Math.abs(rotation % 180) === 90
      const w = rotated ? naturalHeight : naturalWidth
      const h = rotated ? naturalWidth : naturalHeight
      const pad = 24
      return Math.min((el.clientWidth - pad) / w, (el.clientHeight - pad) / h, 4)
    },
    [containerRef, naturalWidth, naturalHeight],
  )

  const fit = useCallback(() => {
    setT((prev) => {
      const s = computeFit(prev.rotation)
      fitScaleRef.current = s
      return { ...prev, scale: s, x: 0, y: 0 }
    })
  }, [computeFit])

  const reset = useCallback(() => {
    const s = computeFit(0)
    fitScaleRef.current = s
    setT({ scale: s, rotation: 0, x: 0, y: 0 })
  }, [computeFit])

  const zoomBy = useCallback((factor: number) => {
    setT((prev) => ({ ...prev, scale: clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE) }))
  }, [])

  const rotate = useCallback(() => {
    setT((prev) => {
      const rotation = (prev.rotation + 90) % 360
      return { ...prev, rotation, scale: computeFit(rotation), x: 0, y: 0 }
    })
  }, [computeFit])

  const panBy = useCallback((dx: number, dy: number) => {
    setT((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
  }, [])

  // Fit on first load and whenever the container is resized.
  useEffect(() => {
    reset()
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setT((prev) => {
        const atFit = Math.abs(prev.scale - fitScaleRef.current) < 0.001 && prev.x === 0 && prev.y === 0
        if (!atFit) return prev
        const s = computeFit(prev.rotation)
        fitScaleRef.current = s
        return { ...prev, scale: s }
      })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef, computeFit, reset])

  return { t, fit, reset, zoomBy, rotate, panBy, setT }
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}
