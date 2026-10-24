import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { DesignImage } from '@/components/design/DesignImage'
import { FutureFeatures } from '@/components/design/FutureFeatures'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { ProgressSteps } from '@/components/ui/ProgressSteps'
import { StepHeader } from '@/components/ui/StepHeader'
import { currentVersion } from '@/features/versions/versionHistory'
import { useSaveDesign } from '@/hooks/useSaveDesign'
import { designActions, useDesignStore } from '@/state/designStore'

export function ResultPage() {
  const project = useDesignStore((s) => s.project)
  const dirty = useDesignStore((s) => s.dirty)
  const { user } = useAuth()
  const navigate = useNavigate()
  const { save, saving, message } = useSaveDesign()
  const [confirmReset, setConfirmReset] = useState(false)

  const version = currentVersion(project.versions, project.currentVersionId)

  if (!version) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20">
        <Notice
          tone="info"
          title="Your design hasn't been created yet"
          action={<ButtonLink to="/design/brief" size="sm">Go to my brief</ButtonLink>}
        >
          Complete your brief and choose “Create my design”.
        </Notice>
      </div>
    )
  }

  const startOver = () => {
    designActions.startNewProject(user?.id)
    navigate('/design')
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-14">
      <ProgressSteps current="Design" />
      <StepHeader eyebrow={`Version ${version.versionNumber}`} title="Your bridal design" />

      <div className="mx-auto mt-10 max-w-3xl">
        <DesignImage version={version} className="h-[70vh] min-h-[24rem]" />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <input
            aria-label="Design name"
            className="min-w-0 flex-1 border-b border-transparent bg-transparent py-1 font-display text-lg text-ink focus:border-gold focus:outline-none"
            defaultValue={project.title}
            onBlur={(e) => designActions.setTitle(e.target.value)}
          />
          <span>{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
        </div>

        {message && (
          <Notice tone={message.tone} className="mt-4">
            {message.text}
          </Notice>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <ButtonLink to="/design/edit" size="lg">
            Edit my dress
          </ButtonLink>
          <Button size="lg" variant="secondary" onClick={save} loading={saving}>
            Save design
          </Button>
          <Button size="lg" variant="ghost" onClick={() => setConfirmReset(true)}>
            Start over
          </Button>
        </div>

        {confirmReset && (
          <Notice
            tone="warning"
            className="mt-6"
            title="Start a new design?"
            action={
              <div className="flex flex-wrap gap-2">
                {dirty && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (await save()) startOver()
                    }}
                    loading={saving}
                  >
                    Save, then start over
                  </Button>
                )}
                <Button size="sm" variant={dirty ? 'ghost' : 'primary'} onClick={startOver}>
                  {dirty ? 'Start over without saving' : 'Start over'}
                </Button>
                <Button size="sm" variant="quiet" onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
              </div>
            }
          >
            {dirty
              ? 'This design has unsaved changes. Save it to My Designs first so nothing is lost.'
              : 'This design is saved in My Designs.'}
          </Notice>
        )}

        <FutureFeatures />
      </div>
    </div>
  )
}
