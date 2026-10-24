import { useRef } from 'react'
import { PreviewBadge } from '@/components/design/DesignImage'
import { DrawingCanvas } from '@/features/drawing/DrawingCanvas'
import type { DrawingController } from '@/features/drawing/useDrawing'
import { useContainFit } from '@/hooks/useContainFit'
import type { DesignVersion } from '@/types/design'

/**
 * The design image with the drawing layer laid exactly on top.
 * The image element is never modified — drawings are a separate layer.
 */
export function EditorCanvas({
  version,
  drawing,
  drawingEnabled,
}: {
  version: DesignVersion
  drawing: DrawingController
  drawingEnabled: boolean
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const size = useContainFit(boxRef, version.width, version.height)

  return (
    <div ref={boxRef} className="checker relative flex h-[62vh] min-h-[22rem] items-center justify-center overflow-hidden border border-line lg:h-[calc(100dvh-13rem)]">
      {size.width > 0 && (
        <div className="relative shadow-soft" style={{ width: size.width, height: size.height }}>
          <img
            src={version.imageUrl}
            alt={`Your design, version ${version.versionNumber}`}
            className="absolute inset-0 h-full w-full select-none bg-white"
            draggable={false}
          />
          <DrawingCanvas
            className="absolute inset-0 h-full w-full"
            paths={drawing.paths}
            brush={drawing.brush}
            enabled={drawingEnabled}
            onCommit={drawing.commitPath}
          />
        </div>
      )}
      <PreviewBadge version={version} />
    </div>
  )
}
