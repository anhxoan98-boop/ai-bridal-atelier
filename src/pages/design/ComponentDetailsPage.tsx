import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { ProgressSteps } from '@/components/ui/ProgressSteps'
import { StepHeader } from '@/components/ui/StepHeader'
import { ImageDropzone } from '@/components/upload/ImageDropzone'
import { ReferencePanel } from '@/components/viewer/ReferencePanel'
import { ORDERED_COMPONENTS } from '@/features/design/componentCatalog'
import { cn } from '@/lib/cn'
import { designActions, useDesignStore } from '@/state/designStore'
import type { ComponentType } from '@/types/design'

export function ComponentDetailsPage() {
  const project = useDesignStore((s) => s.project)
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()

  const requested = params.get('part') as ComponentType | null
  const activeIndex = Math.max(0, ORDERED_COMPONENTS.findIndex((c) => c.type === requested))
  const active = ORDERED_COMPONENTS[activeIndex] ?? ORDERED_COMPONENTS[0]!
  const component = project.components.find((c) => c.type === active.type)
  const isLast = activeIndex === ORDERED_COMPONENTS.length - 1

  const goTo = (index: number) => {
    const target = ORDERED_COMPONENTS[index]
    if (target) setParams({ part: target.type })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const next = () => (isLast ? navigate('/design/brief') : goTo(activeIndex + 1))

  if (!project.overallReference) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20">
        <Notice
          tone="warning"
          title="Let's start with your overall vision"
          action={<ButtonLink to="/design" size="sm">Go to step 1</ButtonLink>}
        >
          Please upload one image of the overall dress style first. It guides how every detail fits together.
        </Notice>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
      <ProgressSteps current="Details" />
      <StepHeader
        eyebrow="Step 2"
        title="Let's design the details"
        lead="Choose a reference image for each part of your dress."
        support="Every part is optional — add only what matters to you."
      />

      {/* Part selector: horizontal on mobile, vertical rail on desktop */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-12">
        <nav aria-label="Dress parts" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
          <ol className="flex gap-2 lg:flex-col lg:gap-0">
            {ORDERED_COMPONENTS.map((c, i) => {
              const comp = project.components.find((x) => x.type === c.type)
              const isActive = i === activeIndex
              return (
                <li key={c.type} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-current={isActive ? 'step' : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 border px-3 py-2.5 text-left transition lg:border-0 lg:border-l-2 lg:py-3.5',
                      isActive ? 'border-ink bg-white lg:border-gold lg:bg-transparent' : 'border-line hover:border-gold/60',
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden bg-pearl">
                      {comp?.image?.thumbnailUrl ? (
                        <img src={comp.image.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <span className="font-display text-sm text-muted">{String(c.step).padStart(2, '0')}</span>
                      )}
                    </span>
                    <span className="whitespace-nowrap">
                      <span className={cn('block text-[11px] uppercase tracking-[0.16em]', isActive ? 'text-ink' : 'text-ink-soft')}>
                        {c.label}
                      </span>
                      <span className="hidden text-xs text-muted lg:block">
                        {comp?.image ? 'Reference added' : 'Optional'}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <section key={active.type} className="animate-fade-up">
          <p className="eyebrow">
            {String(active.step).padStart(2, '0')} / {String(ORDERED_COMPONENTS.length).padStart(2, '0')}
          </p>
          <h2 className="mt-2 text-3xl uppercase tracking-[0.08em] sm:text-4xl">{active.label}</h2>
          <p className="mt-2 font-display text-xl italic text-ink-soft">{active.question}</p>
          <p className="mt-1 text-sm text-muted">{active.hint}</p>

          <div className="mt-6">
            {component?.image ? (
              <ReferencePanel
                image={component.image}
                label={active.label}
                height="medium"
                onReplace={(img) => designActions.setComponentImage(active.type, img)}
                onRemove={() => designActions.setComponentImage(active.type, undefined)}
              />
            ) : (
              <ImageDropzone
                size="md"
                title="Upload reference"
                onImage={(img) => designActions.setComponentImage(active.type, img)}
              />
            )}
          </div>

          <div className="mt-5">
            <label htmlFor={`note-${active.type}`} className="field-label">
              What do you love about it? <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              id={`note-${active.type}`}
              rows={2}
              className="field-input resize-none"
              placeholder="e.g. The lace pattern, but with a lower neckline."
              value={component?.userInstruction ?? ''}
              onChange={(e) => designActions.setComponentInstruction(active.type, e.target.value)}
            />
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="quiet"
              onClick={() => (activeIndex === 0 ? navigate('/design') : goTo(activeIndex - 1))}
            >
              ← Back
            </Button>
            <div className="flex flex-col gap-3 sm:flex-row">
              {!isLast && (
                <Button variant="ghost" onClick={() => navigate('/design/brief')}>
                  Skip to brief
                </Button>
              )}
              <Button onClick={next}>
                {component?.image ? (isLast ? 'Review my brief' : 'Next part') : 'Continue without an image'}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
