import { useCallback, useState } from 'react'
import {
  canRedo,
  canUndo,
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
  type History,
} from '@/lib/history'
import type { DrawingPath } from '@/types/design'
import { DEFAULT_BRUSH, type BrushSettings } from './drawingModel'

/** State of the instruction layer: committed strokes with undo/redo, plus brush settings. */
export function useDrawing(initialPaths: DrawingPath[] = []) {
  const [history, setHistory] = useState<History<DrawingPath[]>>(() => createHistory(initialPaths))
  const [brush, setBrush] = useState<BrushSettings>(DEFAULT_BRUSH)

  const commitPath = useCallback((path: DrawingPath) => {
    setHistory((h) => pushHistory(h, [...h.present, path]))
  }, [])

  const undo = useCallback(() => setHistory((h) => undoHistory(h)), [])
  const redo = useCallback(() => setHistory((h) => redoHistory(h)), [])

  const clear = useCallback(() => {
    setHistory((h) => (h.present.length === 0 ? h : pushHistory(h, [])))
  }, [])

  /** Start fresh (e.g. after an edit was applied and a new version is shown). */
  const reset = useCallback((paths: DrawingPath[] = []) => setHistory(createHistory(paths)), [])

  const updateBrush = useCallback((patch: Partial<BrushSettings>) => {
    setBrush((b) => ({ ...b, ...patch }))
  }, [])

  return {
    paths: history.present,
    brush,
    updateBrush,
    commitPath,
    undo,
    redo,
    clear,
    reset,
    canUndo: canUndo(history),
    canRedo: canRedo(history),
  }
}

export type DrawingController = ReturnType<typeof useDrawing>
