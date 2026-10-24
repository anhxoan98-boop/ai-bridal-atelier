import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { ImageDropzone } from '@/components/upload/ImageDropzone'
import { ORDERED_COMPONENTS } from '@/features/design/componentCatalog'
import { cn } from '@/lib/cn'
import type { AiStatus } from '@/services/ai/types'
import type { ComponentType, ReferenceImage } from '@/types/design'

const EXAMPLES = [
  'Make the skirt fuller.',
  'Add long sleeves.',
  'Remove the flowers from the bodice.',
  'Make the train longer.',
  'Keep everything else unchanged.',
]

export type TargetArea = ComponentType | 'whole-dress' | undefined

type Props = {
  instruction: string
  onInstructionChange: (v: string) => void
  targetArea: TargetArea
  onTargetAreaChange: (v: TargetArea) => void
  references: ReferenceImage[]
  onAddReference: (img: ReferenceImage) => void
  onRemoveReference: (id: string) => void
  hasDrawing: boolean
  onApply: () => void
  applying: boolean
  status: AiStatus | null
  error: string | null
  success: string | null
}

export function AiDesignerPanel(props: Props) {
  const {
    instruction,
    onInstructionChange,
    targetArea,
    onTargetAreaChange,
    references,
    onAddReference,
    onRemoveReference,
    hasDrawing,
    onApply,
    applying,
    status,
    error,
    success,
  } = props
  const editingReady = status?.configured === true && status.capabilities.editing
  const canApply = (instruction.trim().length > 0 || hasDrawing) && !applying

  return (
    <aside className="flex flex-col gap-6 border border-line bg-white/70 p-5 sm:p-6" aria-labelledby="ai-designer">
      <div>
        <p className="eyebrow">Your designer</p>
        <h2 id="ai-designer" className="mt-1 text-3xl uppercase tracking-[0.1em]">AI Designer</h2>
      </div>

      {status && !editingReady && (
        <Notice tone="warning" title="AI service not configured">
          You can draw and describe your changes now; applying them needs an AI provider to be connected.
        </Notice>
      )}

      <div>
        <label htmlFor="edit-instruction" className="sr-only">
          Describe your change
        </label>
        <textarea
          id="edit-instruction"
          rows={4}
          value={instruction}
          onChange={(e) => onInstructionChange(e.target.value)}
          placeholder="Tell me what you would like to change..."
          className="field-input resize-none font-display text-xl leading-snug"
        />
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => onInstructionChange(instruction ? `${instruction.trim()} ${ex}` : ex)}
              className="text-left text-xs italic text-muted/90 transition hover:text-gold-deep"
            >
              “{ex}”
            </button>
          ))}
        </div>
        {hasDrawing && (
          <p className="mt-3 text-xs text-sage">✓ Your drawing will show the designer exactly where to change.</p>
        )}
      </div>

      <div>
        <p className="field-label">Which part? <span className="normal-case tracking-normal">(optional)</span></p>
        <div className="flex flex-wrap gap-1.5">
          {[{ type: 'whole-dress' as const, shortLabel: 'Whole dress' }, ...ORDERED_COMPONENTS].map((c) => (
            <button
              key={c.type}
              type="button"
              aria-pressed={targetArea === c.type}
              onClick={() => onTargetAreaChange(targetArea === c.type ? undefined : c.type)}
              className={cn(
                'border px-3 py-1.5 text-[10.5px] uppercase tracking-[0.14em] transition',
                targetArea === c.type ? 'border-ink bg-ink text-ivory' : 'border-line text-ink-soft hover:border-gold',
              )}
            >
              {c.shortLabel}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="field-label">Reference images <span className="normal-case tracking-normal">(optional)</span></p>
        {references.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-2">
            {references.map((r) => (
              <li key={r.id} className="relative h-20 w-16 border border-line bg-pearl">
                <img src={r.thumbnailUrl ?? r.imageUrl} alt="Reference for this change" className="h-full w-full object-cover" loading="lazy" />
                <button
                  type="button"
                  onClick={() => onRemoveReference(r.id)}
                  aria-label="Remove reference"
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-ivory"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <ImageDropzone size="sm" title="Add a reference" onImage={onAddReference} />
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      {success && <Notice tone="success">{success}</Notice>}

      <Button size="lg" onClick={onApply} disabled={!canApply} loading={applying}>
        Apply change
      </Button>
    </aside>
  )
}
