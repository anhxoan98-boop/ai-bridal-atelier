import { useEffect, useState, type RefObject } from 'react'

/**
 * Largest size with the image's aspect ratio that fits inside the container
 * (like object-fit: contain), so overlays can match the image exactly.
 */
export function useContainFit(containerRef: RefObject<HTMLElement | null>, naturalWidth: number, naturalHeight: number) {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el || !naturalWidth || !naturalHeight) return
    const measure = () => {
      const cw = el.clientWidth
      const ch = el.clientHeight
      if (!cw || !ch) return
      const scale = Math.min(cw / naturalWidth, ch / naturalHeight)
      setSize({ width: Math.floor(naturalWidth * scale), height: Math.floor(naturalHeight * scale) })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef, naturalWidth, naturalHeight])

  return size
}
