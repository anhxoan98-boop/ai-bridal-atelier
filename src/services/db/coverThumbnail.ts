import { createThumbnail, loadImageElement } from '@/features/images/imageProcessing'
import { currentVersion } from '@/features/versions/versionHistory'
import type { DesignProject } from '@/types/design'

/** URL of the image that best represents a project in the gallery. */
export function coverSourceUrl(project: DesignProject): string | undefined {
  const v = currentVersion(project.versions, project.currentVersionId)
  return v?.imageUrl ?? project.generatedDesign?.imageUrl ?? project.overallReference?.imageUrl
}

/** Small WEBP used on "My Designs" cards so the grid never loads full-size images. */
export async function buildCoverThumbnail(project: DesignProject): Promise<Blob | null> {
  const src = coverSourceUrl(project)
  if (!src) return null
  try {
    const img = await loadImageElement(src)
    return await createThumbnail(img, 640)
  } catch {
    return null
  }
}
