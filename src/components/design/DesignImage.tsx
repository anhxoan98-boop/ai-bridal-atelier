import { cn } from '@/lib/cn'
import type { DesignVersion } from '@/types/design'

/** Displays a design version in full (contain), with an honest label for preview stand-ins. */
export function DesignImage({ version, className }: { version: DesignVersion; className?: string }) {
  return (
    <figure className={cn('relative flex items-center justify-center overflow-hidden border border-line bg-white', className)}>
      <img
        src={version.imageUrl}
        alt={`Bridal design, version ${version.versionNumber}`}
        width={version.width}
        height={version.height}
        className="h-full w-full object-contain"
      />
      <PreviewBadge version={version} />
    </figure>
  )
}

export function PreviewBadge({ version }: { version: DesignVersion }) {
  if (version.source !== 'reference-preview') return null
  return (
    <span className="absolute left-3 top-3 max-w-[85%] bg-ink/85 px-3 py-1.5 text-[10px] uppercase leading-relaxed tracking-[0.16em] text-ivory">
      Preview · your reference image, not an AI design
    </span>
  )
}
