import { cn } from '@/lib/cn'

const STEPS = ['Vision', 'Details', 'Brief', 'Design', 'Refine'] as const
export type WorkflowStep = (typeof STEPS)[number]

/** Quiet progress indicator across the design journey. */
export function ProgressSteps({ current }: { current: WorkflowStep }) {
  const index = STEPS.indexOf(current)
  return (
    <nav aria-label="Design progress" className="mx-auto mb-10 flex max-w-md items-center justify-center gap-2 sm:gap-3">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-center gap-1.5">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full transition',
                i < index && 'bg-gold',
                i === index && 'bg-ink ring-4 ring-champagne',
                i > index && 'bg-line',
              )}
            />
            <span
              className={cn(
                'text-[9.5px] uppercase tracking-[0.18em]',
                i === index ? 'text-ink' : 'text-muted/80',
              )}
              aria-current={i === index ? 'step' : undefined}
            >
              {s}
            </span>
          </div>
          {i < STEPS.length - 1 && <span className="mb-4 h-px w-5 bg-line sm:w-8" />}
        </div>
      ))}
    </nav>
  )
}
