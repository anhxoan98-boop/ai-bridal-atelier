import { describe, expect, it } from 'vitest'
import type { DrawingPath } from '@/types/design'
import { guessDressZone, isClosedLoop, pathBounds, simplifyPoints } from './drawingGeometry'
import { createHistory, pushHistory, redoHistory, undoHistory } from '@/lib/history'

const pen = (points: Array<[number, number]>, size = 0.01): DrawingPath => ({
  id: Math.random().toString(),
  tool: 'pen',
  color: '#000',
  size,
  opacity: 1,
  points: points.map(([x, y]) => ({ x, y, pressure: 0.5 })),
})

const circle = (cx: number, cy: number, r: number, n = 24): Array<[number, number]> =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
  })

describe('drawing geometry', () => {
  it('computes padded normalised bounds, ignoring the eraser', () => {
    const eraser: DrawingPath = { ...pen([[0, 0], [1, 1]]), tool: 'eraser' }
    const box = pathBounds([pen([[0.2, 0.3], [0.4, 0.5]], 0.02), eraser])!
    expect(box.x).toBeCloseTo(0.19)
    expect(box.y).toBeCloseTo(0.29)
    expect(box.width).toBeCloseTo(0.22)
    expect(box.height).toBeCloseTo(0.22)
  })

  it('returns null when nothing is drawn', () => {
    expect(pathBounds([])).toBeNull()
  })

  it('recognises an outline drawn around something', () => {
    expect(isClosedLoop(pen(circle(0.5, 0.5, 0.1)))).toBe(true)
    expect(isClosedLoop(pen([[0.1, 0.1], [0.2, 0.2], [0.3, 0.3], [0.4, 0.4], [0.5, 0.5], [0.6, 0.6], [0.7, 0.7], [0.8, 0.8]]))).toBe(false)
  })

  it('guesses the dress zone from vertical position', () => {
    expect(guessDressZone({ x: 0.4, y: 0.1, width: 0.2, height: 0.15 })).toBe('upper')
    expect(guessDressZone({ x: 0.4, y: 0.45, width: 0.2, height: 0.1 })).toBe('middle')
    expect(guessDressZone({ x: 0.2, y: 0.7, width: 0.6, height: 0.25 })).toBe('lower')
  })

  it('simplifies dense strokes but keeps both ends', () => {
    const dense = Array.from({ length: 100 }, (_, i) => ({ x: i * 0.0001, y: 0, pressure: 0.5 }))
    const simplified = simplifyPoints(dense)
    expect(simplified.length).toBeLessThan(dense.length)
    expect(simplified[0]).toEqual(dense[0])
    expect(simplified[simplified.length - 1]).toEqual(dense[dense.length - 1])
  })
})

describe('drawing undo/redo history', () => {
  it('undoes and redoes strokes, and a new stroke clears redo', () => {
    let h = createHistory<string[]>([])
    h = pushHistory(h, ['a'])
    h = pushHistory(h, ['a', 'b'])
    h = undoHistory(h)
    expect(h.present).toEqual(['a'])
    h = redoHistory(h)
    expect(h.present).toEqual(['a', 'b'])
    h = undoHistory(h)
    h = pushHistory(h, ['a', 'c'])
    expect(h.future).toHaveLength(0)
    expect(h.present).toEqual(['a', 'c'])
  })
})
