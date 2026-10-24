import { useState, type DragEvent } from 'react'
import { cn } from '@/lib/cn'
import type { ReferenceImage } from '@/types/design'
import { Notice } from '@/components/ui/Notice'
import { useImagePicker } from './useImagePicker'

type Props = {
  onImage: (image: ReferenceImage) => void
  title?: string
  subtitle?: string
  size?: 'lg' | 'md' | 'sm'
  className?: string
}

/** Large, calm upload area: click, keyboard, or drag & drop. */
export function ImageDropzone({
  onImage,
  title = 'Upload an image',
  subtitle = 'JPG, PNG or WEBP · up to 15 MB',
  size = 'lg',
  className,
}: Props) {
  const picker = useImagePicker(onImage)
  const [dragging, setDragging] = useState(false)

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void picker.handleFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={picker.open}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        disabled={picker.busy}
        className={cn(
          'group relative flex w-full flex-col items-center justify-center gap-4 border border-dashed bg-white/50 px-6 text-center transition-all duration-300',
          dragging ? 'border-gold bg-pearl' : 'border-gold/40 hover:border-gold hover:bg-white',
          size === 'lg' && 'min-h-[22rem] sm:min-h-[28rem]',
          size === 'md' && 'min-h-[16rem]',
          size === 'sm' && 'min-h-[8rem] gap-2',
        )}
      >
        <span
          className={cn(
            'flex items-center justify-center rounded-full border border-gold/40 text-gold transition group-hover:scale-105 group-hover:border-gold',
            size === 'sm' ? 'h-9 w-9' : 'h-14 w-14',
          )}
          aria-hidden
        >
          {picker.busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border border-gold border-t-transparent" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" />
            </svg>
          )}
        </span>
        <span className={cn('font-display text-ink', size === 'sm' ? 'text-lg' : 'text-2xl')}>
          {picker.busy ? 'Preparing your image…' : title}
        </span>
        {size !== 'sm' && (
          <span className="text-xs uppercase tracking-[0.18em] text-muted">
            Click or drop here · {subtitle}
          </span>
        )}
      </button>
      <input {...picker.inputProps} />
      {picker.error && (
        <Notice tone="error" className="mt-3">
          {picker.error}
        </Notice>
      )}
    </div>
  )
}
