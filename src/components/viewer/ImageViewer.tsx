import { useRef, type PointerEvent, type ReactNode, type WheelEvent } from 'react'
import { cn } from '@/lib/cn'
import { useViewTransform } from './useViewTransform'

type Props = {
  src: string
  width: number
  height: number
  alt: string
  onReplace?: () => void
  onRemove?: () => void
  /**
   * Optional layer rendered in image space (same size/rotation/zoom as the
   * image). Reserved for future drawing / AI selection on references.
   */
  overlay?: ReactNode
  className?: string
}

/**
 * Shows the FULL original image — never cropped. Zoom, fit, reset, rotate,
 * drag to pan, wheel / pinch to zoom. Rotation is view-only; the file is
 * never modified.
 */
export function ImageViewer({ src, width, height, alt, onReplace, onRemove, overlay, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { t, fit, reset, zoomBy, rotate, panBy } = useViewTransform(containerRef, width, height)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchDist = useRef<number | null>(null)

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinchDist.current) zoomBy(d / pinchDist.current)
      pinchDist.current = d
      return
    }
    panBy(e.clientX - prev.x, e.clientY - prev.y)
  }
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchDist.current = null
  }
  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1)
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div
        ref={containerRef}
        className="checker relative min-h-[18rem] flex-1 cursor-grab touch-none overflow-hidden active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={fit}
      >
        <div
          className="absolute left-1/2 top-1/2 will-change-transform"
          style={{
            width,
            height,
            transform: `translate(-50%, -50%) translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scale})`,
            transformOrigin: 'center center',
          }}
        >
          <img src={src} alt={alt} width={width} height={height} draggable={false} className="block h-full w-full select-none" />
          {overlay && <div className="absolute inset-0">{overlay}</div>}
        </div>
        <span className="pointer-events-none absolute bottom-3 left-3 bg-white/80 px-2 py-1 text-[10px] tracking-[0.15em] text-muted">
          {Math.round(t.scale * 100)}%
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1 border-t border-line bg-white/70 px-2 py-2">
        <ToolButton label="Zoom in" onClick={() => zoomBy(1.25)}>＋</ToolButton>
        <ToolButton label="Zoom out" onClick={() => zoomBy(0.8)}>－</ToolButton>
        <ToolButton label="Fit to screen" onClick={fit}>Fit</ToolButton>
        <ToolButton label="Reset view" onClick={reset}>Reset</ToolButton>
        <ToolButton label="Rotate view" onClick={rotate}>Rotate</ToolButton>
        {(onReplace || onRemove) && <span className="mx-1 h-5 w-px bg-line" aria-hidden />}
        {onReplace && <ToolButton label="Replace image" onClick={onReplace}>Replace</ToolButton>}
        {onRemove && (
          <ToolButton label="Remove image" onClick={onRemove} danger>
            Remove
          </ToolButton>
        )}
      </div>
    </div>
  )
}

function ToolButton({
  children,
  label,
  onClick,
  danger,
}: {
  children: ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'h-9 min-w-9 px-3 text-[10.5px] uppercase tracking-[0.16em] transition',
        danger ? 'text-rose/80 hover:bg-blush hover:text-rose' : 'text-ink-soft hover:bg-pearl hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
