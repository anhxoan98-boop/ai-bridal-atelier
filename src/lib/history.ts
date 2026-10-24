/** Minimal immutable undo/redo stack, used by the drawing layer. */
export type History<T> = {
  past: T[]
  present: T
  future: T[]
}

export function createHistory<T>(initial: T): History<T> {
  return { past: [], present: initial, future: [] }
}

export function pushHistory<T>(h: History<T>, next: T, limit = 100): History<T> {
  const past = [...h.past, h.present]
  return {
    past: past.length > limit ? past.slice(past.length - limit) : past,
    present: next,
    future: [],
  }
}

export function undoHistory<T>(h: History<T>): History<T> {
  if (h.past.length === 0) return h
  const previous = h.past[h.past.length - 1] as T
  return { past: h.past.slice(0, -1), present: previous, future: [h.present, ...h.future] }
}

export function redoHistory<T>(h: History<T>): History<T> {
  if (h.future.length === 0) return h
  const [next, ...rest] = h.future as [T, ...T[]]
  return { past: [...h.past, h.present], present: next, future: rest }
}

export const canUndo = <T,>(h: History<T>) => h.past.length > 0
export const canRedo = <T,>(h: History<T>) => h.future.length > 0
