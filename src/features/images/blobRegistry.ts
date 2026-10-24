/**
 * Keeps the actual image bytes for images that live in this browser session,
 * keyed by image id. The UI only ever sees object URLs; persistence layers
 * pull the blobs from here when saving.
 */
const blobs = new Map<string, Blob>()
const urls = new Map<string, string>()

export const blobRegistry = {
  put(key: string, blob: Blob): string {
    this.release(key)
    blobs.set(key, blob)
    const url = URL.createObjectURL(blob)
    urls.set(key, url)
    return url
  },
  get(key: string): Blob | undefined {
    return blobs.get(key)
  },
  has(key: string): boolean {
    return blobs.has(key)
  },
  urlFor(key: string): string | undefined {
    return urls.get(key)
  },
  /** Make the same bytes available under another key (e.g. design → version id). */
  alias(fromKey: string, toKey: string): void {
    const blob = blobs.get(fromKey)
    if (blob && !blobs.has(toKey)) this.put(toKey, blob)
  },
  release(key: string): void {
    const url = urls.get(key)
    if (url) URL.revokeObjectURL(url)
    urls.delete(key)
    blobs.delete(key)
  },
}

export const thumbKey = (imageId: string) => `${imageId}:thumb`
