import { useEffect, useState } from 'react'
import { AiDesignerPanel, type TargetArea } from '@/components/editor/AiDesignerPanel'
import { DrawingToolbar } from '@/components/editor/DrawingToolbar'
import { EditorCanvas } from '@/components/editor/EditorCanvas'
import { VersionPanel } from '@/components/editor/VersionPanel'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { applyEdit } from '@/features/design/designWorkflow'
import { hasVisibleStrokes, toDrawingInstruction } from '@/features/drawing/drawingModel'
import { useDrawing } from '@/features/drawing/useDrawing'
import { currentVersion } from '@/features/versions/versionHistory'
import { useAiStatus } from '@/hooks/useAiStatus'
import { useSaveDesign } from '@/hooks/useSaveDesign'
import { MESSAGES } from '@/lib/messages'
import { designActions, useDesignStore } from '@/state/designStore'
import type { ReferenceImage } from '@/types/design'

export function EditorPage() {
  const project = useDesignStore((s) => s.project)
  const status = useAiStatus()
  const drawing = useDrawing()
  const { save, saving, message: saveMessage } = useSaveDesign()

  const [drawingEnabled, setDrawingEnabled] = useState(true)
  const [instruction, setInstruction] = useState('')
  const [targetArea, setTargetArea] = useState<TargetArea>(undefined)
  const [refs, setRefs] = useState<ReferenceImage[]>([])
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const version = currentVersion(project.versions, project.currentVersionId)
  const { reset: resetDrawing, undo, redo } = drawing

  // A drawing belongs to the version it was made on.
  useEffect(() => {
    resetDrawing()
  }, [version?.id, resetDrawing])

  // Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z for strokes (not while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) return
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  if (!version) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20">
        <Notice tone="info" title="There's no design to edit yet" action={<ButtonLink to="/design/brief" size="sm">Go to my brief</ButtonLink>} />
      </div>
    )
  }

  const onApply = async () => {
    setError(null)
    setSuccess(null)
    setApplying(true)
    const drawingInstruction = toDrawingInstruction(drawing.paths, drawing.brush, version.width, version.height)
    const result = await applyEdit({ instruction, drawing: drawingInstruction, referenceImages: refs, targetArea })
    setApplying(false)
    if (!result.ok) {
      setError(result.code === 'AI_NOT_CONFIGURED' ? MESSAGES.aiNotConfigured : result.message)
      return
    }
    refs.forEach((r) => designActions.addEditReference(r))
    setInstruction('')
    setRefs([])
    setTargetArea(undefined)
    setSuccess('Your change has been applied as a new version. Earlier versions are kept.')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Version {version.versionNumber} · Refine</p>
          <h1 className="mt-1 text-3xl uppercase tracking-[0.08em] sm:text-4xl">Edit my dress</h1>
        </div>
        <div className="flex gap-2">
          <ButtonLink to="/design/result" variant="quiet" size="sm">
            ← Design
          </ButtonLink>
          <Button size="sm" variant="secondary" onClick={save} loading={saving}>
            Save design
          </Button>
        </div>
      </div>
      {saveMessage && (
        <Notice tone={saveMessage.tone} className="mb-4">
          {saveMessage.text}
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="min-w-0">
          <DrawingToolbar drawing={drawing} drawingEnabled={drawingEnabled} onToggleDrawing={setDrawingEnabled} />
          <EditorCanvas version={version} drawing={drawing} drawingEnabled={drawingEnabled} />
          <p className="mt-2 text-xs text-muted">
            Draw over the area you want to change — circle it or paint over it. Your drawing is a guide only; it never
            alters the design itself.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <AiDesignerPanel
            instruction={instruction}
            onInstructionChange={setInstruction}
            targetArea={targetArea}
            onTargetAreaChange={setTargetArea}
            references={refs}
            onAddReference={(img) => setRefs((r) => [...r, img])}
            onRemoveReference={(id) => setRefs((r) => r.filter((x) => x.id !== id))}
            hasDrawing={hasVisibleStrokes(drawing.paths)}
            onApply={onApply}
            applying={applying}
            status={status}
            error={error}
            success={success}
          />
          <VersionPanel versions={project.versions} currentId={project.currentVersionId} />
        </div>
      </div>
    </div>
  )
}
