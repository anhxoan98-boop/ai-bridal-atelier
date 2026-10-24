import { blobRegistry } from '@/features/images/blobRegistry'
import { STORAGE_FOLDERS, supabase } from '@/lib/supabase'
import { nowIso } from '@/lib/id'
import type {
  ComponentReference,
  ComponentType,
  DesignBrief,
  DesignProject,
  DesignProjectSummary,
  DesignVersion,
  DrawingInstruction,
  GeneratedDesign,
  ImageMimeType,
  ProjectStatus,
  ReferenceAnalysis,
  ReferenceImage,
} from '@/types/design'
import { storageService } from '@/services/storage/storageService'
import { cloneProject, collectImageSlots } from '@/services/storage/imageSlots'
import type { DesignRepository } from './designRepository'
import { buildCoverThumbnail } from './coverThumbnail'

// ── Row shapes (mirror supabase/migrations/0001_init.sql) ────

type ProjectRow = {
  id: string
  user_id: string
  title: string
  status: ProjectStatus
  overall_instruction: string | null
  overall_analysis: ReferenceAnalysis | null
  generated_design: Omit<GeneratedDesign, 'imageUrl'> | null
  current_version_id: string | null
  cover_path: string | null
  version_count: number
  created_at: string
  updated_at: string
}

type ReferenceRow = {
  id: string
  project_id: string
  user_id: string
  role: 'overall' | 'component' | 'edit'
  component_type: ComponentType | null
  component_id: string | null
  storage_path: string
  thumbnail_path: string | null
  mime_type: ImageMimeType
  width: number
  height: number
  size_bytes: number
  user_instruction: string | null
  analysis: ReferenceAnalysis | null
  created_at: string
}

type BriefRow = { project_id: string; user_id: string; brief: DesignBrief; updated_at: string }

type VersionRow = {
  id: string
  project_id: string
  user_id: string
  version_number: number
  storage_path: string
  width: number
  height: number
  source: DesignVersion['source']
  instruction: string
  drawing: DrawingInstruction | null
  reference_image_ids: string[] | null
  parent_version_id: string | null
  created_at: string
}

function db() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

/**
 * Cloud persistence. Images go to the private Storage bucket; Postgres only
 * keeps paths and metadata. Row level security guarantees a user can only
 * read/write their own rows and files.
 */
export class SupabaseDesignRepository implements DesignRepository {
  readonly mode = 'cloud' as const
  private readonly userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  async list(): Promise<DesignProjectSummary[]> {
    const { data, error } = await db()
      .from('design_projects')
      .select('id,title,status,cover_path,version_count,updated_at')
      .order('updated_at', { ascending: false })
      .limit(200)
    if (error) throw error
    const rows = (data ?? []) as Pick<ProjectRow, 'id' | 'title' | 'status' | 'cover_path' | 'version_count' | 'updated_at'>[]
    const urls = await storageService.signedUrls(rows.map((r) => r.cover_path ?? ''))
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      coverImageUrl: r.cover_path ? urls.get(r.cover_path) : undefined,
      versionCount: r.version_count,
      updatedAt: r.updated_at,
    }))
  }

  async load(projectId: string): Promise<DesignProject> {
    const client = db()
    const [projectRes, refsRes, briefRes, versionsRes] = await Promise.all([
      client.from('design_projects').select('*').eq('id', projectId).single(),
      client.from('reference_images').select('*').eq('project_id', projectId).order('created_at'),
      client.from('design_briefs').select('*').eq('project_id', projectId).maybeSingle(),
      client.from('design_versions').select('*').eq('project_id', projectId).order('version_number'),
    ])
    if (projectRes.error) throw projectRes.error
    if (refsRes.error) throw refsRes.error
    if (briefRes.error) throw briefRes.error
    if (versionsRes.error) throw versionsRes.error

    const p = projectRes.data as ProjectRow
    const refs = (refsRes.data ?? []) as ReferenceRow[]
    const versions = (versionsRes.data ?? []) as VersionRow[]

    const paths = [
      ...refs.flatMap((r) => [r.storage_path, r.thumbnail_path ?? '']),
      ...versions.map((v) => v.storage_path),
      p.generated_design?.storagePath ?? '',
    ]
    const urls = await storageService.signedUrls(paths)
    const url = (path?: string | null) => (path ? (urls.get(path) ?? '') : '')

    const toImage = (r: ReferenceRow): ReferenceImage => ({
      id: r.id,
      imageUrl: url(r.storage_path),
      thumbnailUrl: url(r.thumbnail_path) || undefined,
      storagePath: r.storage_path,
      thumbnailPath: r.thumbnail_path ?? undefined,
      mimeType: r.mime_type,
      width: r.width,
      height: r.height,
      sizeBytes: r.size_bytes,
      createdAt: r.created_at,
    })

    const overallRow = refs.find((r) => r.role === 'overall')
    const components: ComponentReference[] = refs
      .filter((r) => r.role === 'component' && r.component_type)
      .map((r) => ({
        id: r.component_id ?? r.id,
        type: r.component_type as ComponentType,
        image: toImage(r),
        userInstruction: r.user_instruction ?? undefined,
        analysis: r.analysis ?? undefined,
      }))

    return {
      id: p.id,
      userId: p.user_id,
      title: p.title,
      status: p.status,
      overallReference: overallRow ? toImage(overallRow) : undefined,
      overallAnalysis: p.overall_analysis ?? undefined,
      overallInstruction: p.overall_instruction ?? undefined,
      components,
      designBrief: (briefRes.data as BriefRow | null)?.brief,
      generatedDesign: p.generated_design
        ? { ...p.generated_design, imageUrl: url(p.generated_design.storagePath) }
        : undefined,
      versions: versions.map((v) => ({
        id: v.id,
        projectId: v.project_id,
        versionNumber: v.version_number,
        imageUrl: url(v.storage_path),
        storagePath: v.storage_path,
        width: v.width,
        height: v.height,
        source: v.source,
        instruction: v.instruction,
        drawing: v.drawing ?? undefined,
        referenceImageIds: v.reference_image_ids ?? undefined,
        parentVersionId: v.parent_version_id,
        createdAt: v.created_at,
      })),
      editReferences: refs.filter((r) => r.role === 'edit').map(toImage),
      currentVersionId: p.current_version_id ?? undefined,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }
  }

  async save(input: DesignProject): Promise<DesignProject> {
    const client = db()
    const userId = this.userId
    const project = cloneProject(input)
    project.userId = userId
    project.updatedAt = nowIso()

    // 1) Upload every image that only exists in this browser so far.
    for (const slot of collectImageSlots(project)) {
      const { url, storagePath } = slot.get()
      if (storagePath) continue
      const blob = blobRegistry.get(slot.key)
      if (!blob) continue
      const path = storageService.buildPath(userId, slot.folder, project.id, slot.key.replace(':', '-'), blob.type)
      await storageService.upload(path, blob)
      slot.set(url, path)
    }

    // 2) Gallery thumbnail.
    let coverPath: string | null = null
    const cover = await buildCoverThumbnail(project)
    if (cover) {
      coverPath = storageService.buildPath(userId, STORAGE_FOLDERS.thumbnails, project.id, 'cover', cover.type)
      await storageService.upload(coverPath, cover)
    }

    // 3) Rows. Order matters for foreign keys: project → refs/brief/versions.
    const { imageUrl: _ignored, ...generatedMeta } = project.generatedDesign ?? { imageUrl: '' }
    const projectRow: Omit<ProjectRow, 'created_at'> & { created_at?: string } = {
      id: project.id,
      user_id: userId,
      title: project.title,
      status: project.status,
      overall_instruction: project.overallInstruction ?? null,
      overall_analysis: project.overallAnalysis ?? null,
      generated_design: project.generatedDesign ? (generatedMeta as Omit<GeneratedDesign, 'imageUrl'>) : null,
      current_version_id: project.currentVersionId ?? null,
      cover_path: coverPath,
      version_count: project.versions.length,
      created_at: project.createdAt,
      updated_at: project.updatedAt,
    }
    const pr = await client.from('design_projects').upsert(projectRow)
    if (pr.error) throw pr.error

    const refRows: ReferenceRow[] = []
    const pushRef = (
      img: ReferenceImage | undefined,
      role: ReferenceRow['role'],
      component?: ComponentReference,
    ) => {
      if (!img?.storagePath) return
      refRows.push({
        id: img.id,
        project_id: project.id,
        user_id: userId,
        role,
        component_type: component?.type ?? null,
        component_id: component?.id ?? null,
        storage_path: img.storagePath,
        thumbnail_path: img.thumbnailPath ?? null,
        mime_type: img.mimeType,
        width: img.width,
        height: img.height,
        size_bytes: img.sizeBytes,
        user_instruction: component?.userInstruction ?? null,
        analysis: component?.analysis ?? null,
        created_at: img.createdAt,
      })
    }
    pushRef(project.overallReference, 'overall')
    project.components.forEach((c) => pushRef(c.image, 'component', c))
    project.editReferences.forEach((r) => pushRef(r, 'edit'))

    // Replace the reference set (customer may have removed some since last save).
    const del = await client.from('reference_images').delete().eq('project_id', project.id)
    if (del.error) throw del.error
    if (refRows.length > 0) {
      const rr = await client.from('reference_images').insert(refRows)
      if (rr.error) throw rr.error
    }

    if (project.designBrief) {
      const br = await client.from('design_briefs').upsert({
        project_id: project.id,
        user_id: userId,
        brief: project.designBrief,
        updated_at: project.designBrief.updatedAt,
      } satisfies BriefRow)
      if (br.error) throw br.error
    }

    // Versions are append-only: upsert, never delete.
    const versionRows: VersionRow[] = project.versions
      .filter((v) => v.storagePath)
      .map((v) => ({
        id: v.id,
        project_id: project.id,
        user_id: userId,
        version_number: v.versionNumber,
        storage_path: v.storagePath as string,
        width: v.width,
        height: v.height,
        source: v.source,
        instruction: v.instruction,
        drawing: v.drawing ?? null,
        reference_image_ids: v.referenceImageIds ?? null,
        parent_version_id: v.parentVersionId,
        created_at: v.createdAt,
      }))
    if (versionRows.length > 0) {
      const vr = await client.from('design_versions').upsert(versionRows)
      if (vr.error) throw vr.error
    }

    return project
  }

  async remove(projectId: string): Promise<void> {
    const { error } = await db().from('design_projects').delete().eq('id', projectId)
    if (error) throw error
    await storageService.removeProjectFiles(this.userId, projectId)
  }
}
