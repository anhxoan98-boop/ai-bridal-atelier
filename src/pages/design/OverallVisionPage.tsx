import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { ProgressSteps } from '@/components/ui/ProgressSteps'
import { StepHeader } from '@/components/ui/StepHeader'
import { ImageDropzone } from '@/components/upload/ImageDropzone'
import { ReferencePanel } from '@/components/viewer/ReferencePanel'
import { designActions, useDesignStore } from '@/state/designStore'

export function OverallVisionPage() {
  const project = useDesignStore((s) => s.project)
  const draftRestored = useDesignStore((s) => s.draftRestored)
  const { user } = useAuth()
  const navigate = useNavigate()
  const image = project.overallReference
  const hasWork = Boolean(image || project.components.some((c) => c.image) || project.versions.length)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8 sm:py-14">
      <ProgressSteps current="Vision" />
      <StepHeader
        eyebrow="Step 1"
        title="Your Overall Vision"
        lead="What would you like your wedding dress to look like overall?"
        support="Upload an image that represents the overall silhouette, style or feeling you want."
      />

      <div className="mt-10 space-y-4">
        {draftRestored && hasWork && (
          <Notice
            tone="info"
            title="Welcome back — your design in progress has been restored."
            action={
              <div className="flex flex-wrap gap-2">
                {project.versions.length > 0 && (
                  <ButtonLink to="/design/result" size="sm" variant="ghost">
                    Go to my design
                  </ButtonLink>
                )}
                <Button size="sm" variant="quiet" onClick={() => designActions.startNewProject(user?.id)}>
                  Start a new design
                </Button>
              </div>
            }
          />
        )}

        {!image ? (
          <ImageDropzone
            onImage={designActions.setOverallReference}
            title="Upload your overall inspiration"
          />
        ) : (
          <>
            <ReferencePanel
              image={image}
              label="Overall vision"
              onReplace={designActions.setOverallReference}
              onRemove={() => designActions.setOverallReference(undefined)}
            />

            <div className="pt-4">
              <label htmlFor="overall-note" className="field-label">
                A note for your designer <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <textarea
                id="overall-note"
                rows={2}
                className="field-input resize-none"
                placeholder="e.g. I love this silhouette, but I'd like it softer and more romantic."
                value={project.overallInstruction ?? ''}
                onChange={(e) => designActions.setOverallInstruction(e.target.value)}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-end">
              <Button size="lg" onClick={() => navigate('/design/details')}>
                Continue
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
