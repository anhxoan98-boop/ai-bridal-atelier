import { useState, type ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Notice } from '@/components/ui/Notice'
import { useImagePicker } from '@/components/upload/useImagePicker'
import type { ReferenceImage } from '@/types/design'
import { ImageViewer } from './ImageViewer'

type Props = {
  image: ReferenceImage
  label: string
  onReplace: (image: ReferenceImage) => void
  onRemove: () => void
  height?: 'tall' | 'medium'
}

/**
 * Shows an uploaded reference in full (object-contain, never cropped) with
 * replace / remove / preview. Preview opens the zoomable viewer.
 */
export function ReferencePanel({ image, label, onReplace, onRemove, height = 'tall' }: Props) {
  const [preview, setPreview] = useState(false)
  const picker = useImagePicker(onReplace)

  return (
    <div className="animate-fade-up">
      <button
        type="button"
        onClick={() => setPreview(true)}
        className={`checker group relative block w-full overflow-hidden border border-line ${
          height === 'tall' ? 'h-[58vh] min-h-[22rem]' : 'h-[44vh] min-h-[18rem]'
        }`}
        aria-label={`Preview ${label}`}
      >
        <img
          src={image.imageUrl}
          alt={label}
          className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.01]"
        />
        <span className="absolute bottom-3 right-3 bg-white/85 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-ink-soft opacity-0 transition group-hover:opacity-100">
          Preview
        </span>
      </button>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          {image.width} × {image.height}px · full image, not cropped
        </p>
        <div className="flex gap-1">
          <LinkButton onClick={() => setPreview(true)}>Preview</LinkButton>
          <LinkButton onClick={picker.open} disabled={picker.busy}>
            {picker.busy ? 'Uploading…' : 'Replace'}
          </LinkButton>
          <LinkButton onClick={onRemove} danger>
            Remove
          </LinkButton>
        </div>
      </div>
      <input {...picker.inputProps} />
      {picker.error && (
        <Notice tone="error" className="mt-3">
          {picker.error}
        </Notice>
      )}

      <Modal open={preview} onClose={() => setPreview(false)} title={label} className="h-dvh sm:h-[88vh]">
        <ImageViewer
          src={image.imageUrl}
          width={image.width}
          height={image.height}
          alt={label}
          onReplace={() => {
            setPreview(false)
            picker.open()
          }}
          onRemove={() => {
            setPreview(false)
            onRemove()
          }}
        />
      </Modal>
    </div>
  )
}

function LinkButton({
  children,
  onClick,
  danger,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 text-[10.5px] uppercase tracking-[0.18em] transition ${
        danger ? 'text-rose/80 hover:text-rose' : 'text-ink-soft hover:text-gold-deep'
      }`}
    >
      {children}
    </button>
  )
}
