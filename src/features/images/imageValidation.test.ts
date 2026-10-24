import { describe, expect, it } from 'vitest'
import { sniffImageType, validateImageHeader } from './imageValidation'

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)].slice(0, 16))

describe('image validation', () => {
  it('detects JPEG, PNG and WEBP from their signatures', () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg')
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('image/png')
    expect(
      sniffImageType(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50)),
    ).toBe('image/webp')
  })

  it('rejects files that only pretend to be images', () => {
    // e.g. "dress.jpg" that is really a PDF
    expect(validateImageHeader(bytes(0x25, 0x50, 0x44, 0x46), 1000).ok).toBe(false)
    // GIF is not an accepted format
    expect(validateImageHeader(bytes(0x47, 0x49, 0x46, 0x38), 1000).ok).toBe(false)
  })

  it('enforces size limits', () => {
    const jpeg = bytes(0xff, 0xd8, 0xff)
    expect(validateImageHeader(jpeg, 0).ok).toBe(false)
    expect(validateImageHeader(jpeg, 20 * 1024 * 1024, 15 * 1024 * 1024).ok).toBe(false)
    expect(validateImageHeader(jpeg, 2 * 1024 * 1024, 15 * 1024 * 1024)).toEqual({ ok: true, mimeType: 'image/jpeg' })
  })
})
