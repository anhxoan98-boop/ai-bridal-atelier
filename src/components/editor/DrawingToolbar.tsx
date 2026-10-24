import type { ReactNode } from 'react'
import { BRUSH_COLORS } from '@/features/drawing/drawingModel'
import type { DrawingController } from '@/features/drawing/useDrawing'
import { cn } from '@/lib/cn'

export function DrawingToolbar({
  drawing,
  drawingEnabled,
  onToggleDrawing,
}: {
  drawing: DrawingController
  drawingEnabled: boolean
  onToggleDrawing: (on: boolean) => void
}) {
  const { brush, updateBrush } = drawing
  const select = (tool: 'pen' | 'eraser') => {
    updateBrush({ tool })
    onToggleDrawing(true)
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border border-b-0 border-line bg-white/80 px-3 py-2.5">
      <div className="flex items-center gap-1" role="group" aria-label="Drawing tools">
        <Tool active={drawingEnabled && brush.tool === 'pen'} onClick={() => select('pen')} label="Pen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3" /></svg>
        </Tool>
        <Tool active={drawingEnabled && brush.tool === 'eraser'} onClick={() => select('eraser')} label="Eraser">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M8 20h12M4.5 15.5l9-9a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L11 19H8l-3.5-3.5z" /></svg>
        </Tool>
        <Tool active={!drawingEnabled} onClick={() => onToggleDrawing(false)} label="View (stop drawing)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
        </Tool>
      </div>

      <span className="hidden h-6 w-px bg-line sm:block" aria-hidden />

      <div className="flex items-center gap-1" role="group" aria-label="History">
        <Tool onClick={drawing.undo} disabled={!drawing.canUndo} label="Undo stroke">↶</Tool>
        <Tool onClick={drawing.redo} disabled={!drawing.canRedo} label="Redo stroke">↷</Tool>
        <button
          type="button"
          onClick={drawing.clear}
          disabled={drawing.paths.length === 0}
          className="h-9 px-3 text-[10.5px] uppercase tracking-[0.16em] text-ink-soft hover:text-rose disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      <span className="hidden h-6 w-px bg-line md:block" aria-hidden />

      <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Pen colour">
        {BRUSH_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={brush.color === c}
            aria-label={`Colour ${c}`}
            onClick={() => updateBrush({ color: c, tool: 'pen' })}
            className={cn('h-5 w-5 rounded-full border-2 transition', brush.color === c ? 'scale-110 border-white ring-1 ring-ink' : 'border-white')}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <label className="flex min-w-[8rem] flex-1 items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted">
        Size
        <input
          type="range"
          className="slider"
          min={0.004}
          max={0.06}
          step={0.002}
          value={brush.size}
          onChange={(e) => updateBrush({ size: Number(e.target.value) })}
        />
      </label>
      <label className="flex min-w-[8rem] flex-1 items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted">
        Opacity
        <input
          type="range"
          className="slider"
          min={0.2}
          max={1}
          step={0.05}
          value={brush.opacity}
          onChange={(e) => updateBrush({ opacity: Number(e.target.value) })}
        />
      </label>
    </div>
  )
}

function Tool({
  children,
  label,
  onClick,
  active,
  disabled,
}: {
  children: ReactNode
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-9 w-9 items-center justify-center text-base transition disabled:opacity-35',
        active ? 'bg-ink text-ivory' : 'text-ink-soft hover:bg-pearl',
      )}
    >
      {children}
    </button>
  )
}
