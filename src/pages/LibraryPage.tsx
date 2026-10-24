import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { Spinner } from '@/components/ui/Spinner'
import { StepHeader } from '@/components/ui/StepHeader'
import { cn } from '@/lib/cn'
import { libraryService } from '@/services/library/libraryService'
import { LIBRARY_CATEGORIES, type LibraryCategory, type LibraryImage } from '@/types/library'

/**
 * Shared visual reference library (future: 500–1,000 images).
 * Paginated thumbnails only — full-size images are never bulk-loaded.
 */
export function LibraryPage() {
  const [category, setCategory] = useState<LibraryCategory | 'all'>('all')
  const [items, setItems] = useState<LibraryImage[]>([])
  const [cursor, setCursor] = useState<number | null>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (cat: LibraryCategory | 'all', from: number, append: boolean) => {
      setLoading(true)
      setError(null)
      try {
        const page = await libraryService.listPage(cat, from)
        setItems((prev) => (append ? [...prev, ...page.items] : page.items))
        setCursor(page.nextCursor)
      } catch (err) {
        console.error(err)
        setError('The library could not be loaded right now.')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    void load(category, 0, false)
  }, [category, load])

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
      <StepHeader eyebrow="Inspiration" title="Reference library" lead="Visual references for every part of your dress." />

      <div className="-mx-4 mt-10 flex gap-2 overflow-x-auto px-4 pb-1 sm:flex-wrap sm:justify-center">
        {[{ id: 'all' as const, label: 'All' }, ...LIBRARY_CATEGORIES].map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            aria-pressed={category === c.id}
            className={cn(
              'shrink-0 border px-4 py-2 text-[10.5px] uppercase tracking-[0.16em] transition',
              category === c.id ? 'border-ink bg-ink text-ivory' : 'border-line text-ink-soft hover:border-gold',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error && <Notice tone="error" className="mx-auto mt-8 max-w-xl">{error}</Notice>}

      {!loading && items.length === 0 && !error && (
        <p className="mx-auto mt-16 max-w-md text-center font-display text-2xl italic leading-snug text-muted">
          {libraryService.isAvailable()
            ? 'Our curated reference library is being prepared.'
            : 'The reference library will be available once the cloud service is connected.'}
        </p>
      )}

      {items.length > 0 && (
        <ul className="mt-10 columns-2 gap-3 sm:columns-3 lg:columns-4">
          {items.map((img) => (
            <li key={img.id} className="mb-3 break-inside-avoid">
              <img
                src={img.thumbnailUrl}
                alt={`${img.category} reference`}
                width={img.width}
                height={img.height}
                loading="lazy"
                decoding="async"
                className="h-auto w-full border border-line bg-pearl"
              />
            </li>
          ))}
        </ul>
      )}

      {loading && (
        <div className="py-12">
          <Spinner />
        </div>
      )}
      {!loading && cursor !== null && items.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Button variant="ghost" onClick={() => load(category, cursor, true)}>
            Show more
          </Button>
        </div>
      )}
    </div>
  )
}
