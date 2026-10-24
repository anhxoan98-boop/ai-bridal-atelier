import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { ProgressSteps } from '@/components/ui/ProgressSteps'
import { StepHeader } from '@/components/ui/StepHeader'
import { COMPONENT_CATALOG, ORDERED_COMPONENTS } from '@/features/design/componentCatalog'
import {
  analyzeReferencesAndBrief,
  emptyBrief,
  generateDesign,
  startReferencePreview,
} from '@/features/design/designWorkflow'
import { useAiStatus } from '@/hooks/useAiStatus'
import { nowIso } from '@/lib/id'
import { MESSAGES } from '@/lib/messages'
import { designActions, getDesignState, useDesignStore } from '@/state/designStore'
import type { DesignBrief } from '@/types/design'

type TextField = Exclude<keyof DesignBrief, 'materials' | 'colors' | 'source' | 'updatedAt'>

const SECTIONS: { key: TextField; label: string; placeholder: string }[] = [
  { key: 'overallStyle', label: 'Overall style', placeholder: 'e.g. Dramatic, romantic princess gown with a modern, clean finish.' },
  { key: 'silhouette', label: 'Silhouette', placeholder: 'e.g. Ball gown — fitted bodice, very full rounded skirt.' },
  { key: 'bodice', label: 'Bodice', placeholder: 'e.g. Sweetheart neckline, structured corset with soft boning.' },
  { key: 'skirt', label: 'Skirt', placeholder: 'e.g. Voluminous tulle layers, floor length.' },
  { key: 'sleeves', label: 'Shoulders / Sleeves', placeholder: 'e.g. Long sheer lace sleeves, off the shoulder.' },
  { key: 'back', label: 'Back', placeholder: 'e.g. Low V back with covered buttons.' },
  { key: 'train', label: 'Train', placeholder: 'e.g. Cathedral-length train.' },
  { key: 'details', label: 'Details', placeholder: 'e.g. 3D floral appliqué scattered over bodice and skirt.' },
]

type Busy = 'analyzing' | 'creating' | null

export function DesignBriefPage() {
  const project = useDesignStore((s) => s.project)
  const status = useAiStatus()
  const navigate = useNavigate()
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreviewOffer, setShowPreviewOffer] = useState(false)

  const brief = project.designBrief
  const aiReady = status?.configured === true
  const canAnalyze = aiReady && Boolean(status?.capabilities.vision && status.capabilities.briefing)
  const canGenerate = aiReady && Boolean(status?.capabilities.generation)

  if (!project.overallReference) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20">
        <Notice tone="warning" title="Your brief starts with your overall vision" action={<ButtonLink to="/design" size="sm">Go to step 1</ButtonLink>} />
      </div>
    )
  }

  const updateBrief = (patch: Partial<DesignBrief>) => {
    const current = getDesignState().project.designBrief ?? emptyBrief()
    designActions.setBrief({ ...current, ...patch, source: 'customer', updatedAt: nowIso() })
  }

  const analyze = async () => {
    setBusy('analyzing')
    setError(null)
    const r = await analyzeReferencesAndBrief(getDesignState().project)
    setBusy(null)
    if (!r.ok) setError(r.message)
  }

  const create = async () => {
    setError(null)
    if (!getDesignState().project.designBrief) designActions.setBrief(emptyBrief())
    if (!canGenerate) {
      setShowPreviewOffer(true)
      return
    }
    setBusy('creating')
    const r = await generateDesign(getDesignState().project)
    setBusy(null)
    if (r.ok) navigate('/design/result')
    else setError(r.message)
  }

  const continueWithPreview = () => {
    const r = startReferencePreview(getDesignState().project)
    if (r.ok) navigate('/design/result')
    else setError(r.message)
  }

  const references = [
    { key: 'overall', label: 'Overall', url: project.overallReference.thumbnailUrl ?? project.overallReference.imageUrl },
    ...ORDERED_COMPONENTS.flatMap((meta) => {
      const c = project.components.find((x) => x.type === meta.type)
      return c?.image ? [{ key: meta.type, label: meta.shortLabel, url: c.image.thumbnailUrl ?? c.image.imageUrl }] : []
    }),
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-14">
      <ProgressSteps current="Brief" />
      <StepHeader
        eyebrow="Step 3"
        title="Your design brief"
        lead="Everything your dress should be, in one place."
        support="Your references are combined into one coherent design — not pasted together."
      />

      {/* References used */}
      <div className="mt-10 flex gap-3 overflow-x-auto pb-2">
        {references.map((r) => (
          <figure key={r.key} className="shrink-0 text-center">
            <div className="h-24 w-20 overflow-hidden border border-line bg-pearl sm:h-28 sm:w-24">
              <img src={r.url} alt={r.label} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <figcaption className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-muted">{r.label}</figcaption>
          </figure>
        ))}
        <ButtonLink to="/design/details" variant="quiet" size="sm" className="self-center">
          Edit references
        </ButtonLink>
      </div>

      <div className="mt-6 space-y-3">
        {status && !aiReady && (
          <Notice tone="warning" title="AI service not configured">
            The AI designer isn't connected yet, so your references can't be analysed automatically. You can write
            your brief by hand below — it will be used as soon as AI is connected.
          </Notice>
        )}
        {error && <Notice tone="error">{error}</Notice>}
      </div>

      <div className="mt-8 flex flex-col items-start justify-between gap-4 border-y border-line py-5 sm:flex-row sm:items-center">
        <p className="text-sm text-muted">
          {brief
            ? brief.source === 'ai'
              ? 'Written by your AI designer · edit anything you like.'
              : 'Written by you.'
            : 'Your brief is empty.'}
        </p>
        <Button
          variant="ghost"
          onClick={analyze}
          loading={busy === 'analyzing'}
          disabled={!canAnalyze || busy !== null}
          title={canAnalyze ? undefined : MESSAGES.aiNotConfigured}
        >
          {brief?.source === 'ai' ? 'Re-analyse my references' : 'Analyse my references with AI'}
        </Button>
      </div>

      <div className="mt-8 grid gap-x-10 gap-y-7 md:grid-cols-2">
        {SECTIONS.map((s) => {
          const hint =
            s.key in COMPONENT_CATALOG
              ? project.components.find((c) => c.type === s.key)?.userInstruction
              : s.key === 'overallStyle'
                ? project.overallInstruction
                : undefined
          return (
            <div key={s.key}>
              <label htmlFor={`brief-${s.key}`} className="field-label">
                {s.label}
              </label>
              <textarea
                id={`brief-${s.key}`}
                rows={3}
                className="field-input resize-y font-display text-lg leading-snug"
                placeholder={s.placeholder}
                value={brief?.[s.key] ?? ''}
                onChange={(e) => updateBrief({ [s.key]: e.target.value })}
              />
              {hint && <p className="mt-1.5 text-xs text-muted">Your note: “{hint}”</p>}
            </div>
          )
        })}
        <ListField label="Materials" value={brief?.materials} placeholder="e.g. silk mikado, French lace, tulle" onChange={(v) => updateBrief({ materials: v })} />
        <ListField label="Colours" value={brief?.colors} placeholder="e.g. ivory, champagne" onChange={(v) => updateBrief({ colors: v })} />
      </div>

      <div className="mt-12 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <ButtonLink to="/design/details" variant="quiet">
          ← Back
        </ButtonLink>
        <Button size="lg" onClick={create} loading={busy === 'creating'} disabled={busy !== null}>
          Create my design
        </Button>
      </div>

      {showPreviewOffer && (
        <div className="mt-8 animate-fade-up">
          <Notice
            tone="warning"
            title="AI service not configured"
            action={
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={continueWithPreview}>
                  Continue in preview mode
                </Button>
                <Button size="sm" variant="quiet" onClick={() => setShowPreviewOffer(false)}>
                  Not now
                </Button>
              </div>
            }
          >
            Your design can't be created until an AI provider is connected. Meanwhile, you can preview the rest of
            the studio — editor, drawing, saving — using your overall reference as a stand-in. It will be clearly
            labelled as a preview, not an AI design.
          </Notice>
        </div>
      )}
    </div>
  )
}

function ListField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value?: string[]
  placeholder: string
  onChange: (v: string[]) => void
}) {
  const id = `brief-${label.toLowerCase()}`
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        className="field-input"
        placeholder={placeholder}
        value={(value ?? []).join(', ')}
        onChange={(e) =>
          onChange(
            e.target.value
              .split(',')
              .map((x) => x.trimStart())
              .filter((x, i, arr) => x.length > 0 || i === arr.length - 1),
          )
        }
      />
    </div>
  )
}
