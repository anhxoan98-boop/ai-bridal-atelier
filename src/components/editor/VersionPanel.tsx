import { Button } from '@/components/ui/Button'
import { canRedoVersion, canUndoVersion, redoVersion, undoVersion } from '@/features/versions/versionHistory'
import { cn } from '@/lib/cn'
import { designActions } from '@/state/designStore'
import type { DesignVersion } from '@/types/design'

/** Every version is kept. Undo/redo move between them; restore jumps to any one. */
export function VersionPanel({ versions, currentId }: { versions: DesignVersion[]; currentId?: string }) {
  const current = currentId ?? versions[versions.length - 1]?.id

  return (
    <section aria-labelledby="versions-title" className="border border-line bg-white/70 p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 id="versions-title" className="eyebrow">
          Versions
        </h3>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="quiet"
            disabled={!canUndoVersion(versions, current)}
            onClick={() => designActions.setCurrentVersion(undoVersion(versions, current))}
          >
            ↶ Undo
          </Button>
          <Button
            size="sm"
            variant="quiet"
            disabled={!canRedoVersion(versions, current)}
            onClick={() => designActions.setCurrentVersion(redoVersion(versions, current))}
          >
            Redo ↷
          </Button>
        </div>
      </div>

      <ol className="mt-3 flex gap-3 overflow-x-auto pb-1 lg:max-h-72 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
        {[...versions].reverse().map((v) => {
          const isCurrent = v.id === current
          return (
            <li key={v.id} className="shrink-0">
              <div
                className={cn(
                  'flex w-56 items-center gap-3 border p-2 transition lg:w-full',
                  isCurrent ? 'border-gold bg-pearl' : 'border-line',
                )}
              >
                <img src={v.imageUrl} alt="" className="h-14 w-11 shrink-0 bg-white object-contain" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Version {v.versionNumber}</p>
                  <p className="truncate text-sm text-ink" title={v.instruction}>
                    {v.instruction}
                  </p>
                </div>
                {isCurrent ? (
                  <span className="text-[9.5px] uppercase tracking-[0.16em] text-gold-deep">Current</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => designActions.setCurrentVersion(v.id)}
                    className="text-[9.5px] uppercase tracking-[0.16em] text-ink-soft hover:text-gold-deep"
                  >
                    Restore
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
