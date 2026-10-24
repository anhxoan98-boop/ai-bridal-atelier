/**
 * Core domain model for AI Bridal Atelier.
 * These types are shared by UI, state, persistence and AI services.
 */

export type ComponentType = 'bodice' | 'skirt' | 'sleeves' | 'back' | 'train' | 'details'

export const COMPONENT_TYPES: readonly ComponentType[] = [
  'bodice',
  'skirt',
  'sleeves',
  'back',
  'train',
  'details',
] as const

export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp'

/**
 * An image the customer provided (overall vision, component reference, or an
 * extra reference uploaded while editing).
 *
 * `imageUrl` is always something the browser can display right now
 * (an object URL for freshly uploaded / locally stored files, or a signed URL
 * from Supabase Storage). `storagePath` is the durable location once saved.
 */
export type ReferenceImage = {
  id: string
  imageUrl: string
  thumbnailUrl?: string
  storagePath?: string
  thumbnailPath?: string
  mimeType: ImageMimeType
  width: number
  height: number
  sizeBytes: number
  createdAt: string
}

export type ComponentReference = {
  id: string
  type: ComponentType
  image?: ReferenceImage
  /** Optional words from the customer, e.g. "I love the lace but want it less sheer". */
  userInstruction?: string
  /** Filled by the AI vision service once analysed. */
  analysis?: ReferenceAnalysis
}

/** Structured output of the vision model for one reference image. */
export type ReferenceAnalysis = {
  summary: string
  attributes: Record<string, string>
  confidence?: number
  analyzedAt: string
  provider: string
}

export type DesignBrief = {
  overallStyle?: string
  silhouette?: string
  bodice?: string
  skirt?: string
  sleeves?: string
  back?: string
  train?: string
  details?: string
  materials?: string[]
  colors?: string[]
  constructionNotes?: string
  /** 'ai' = produced by createDesignBrief, 'customer' = written / edited by hand. */
  source: 'ai' | 'customer'
  updatedAt: string
}

/**
 * Where a design image came from. 'ai' is a real generation.
 * 'reference-preview' is used ONLY when AI is not configured and the customer
 * explicitly chooses to continue the workflow with their own overall
 * reference as a stand-in. The UI labels this clearly — it is never presented
 * as an AI result.
 */
export type DesignImageSource = 'ai' | 'reference-preview'

export type GeneratedDesign = {
  id: string
  projectId: string
  imageUrl: string
  storagePath?: string
  width: number
  height: number
  source: DesignImageSource
  provider?: string
  /** The prompt / brief snapshot that produced the image, for reproducibility. */
  promptSnapshot?: string
  createdAt: string
}

// ── Drawing (instruction layer) ──────────────────────────────

export type DrawingTool = 'pen' | 'eraser'

/** A point in NORMALISED image coordinates (0..1), independent of screen size. */
export type DrawingPoint = {
  x: number
  y: number
  /** Pointer pressure 0..1 (stylus). Mouse/touch report 0.5. */
  pressure: number
}

export type DrawingPath = {
  id: string
  tool: DrawingTool
  points: DrawingPoint[]
  color: string
  /** Brush diameter as a fraction of the image width (so it scales with the image). */
  size: number
  opacity: number
}

/**
 * The customer's drawing over a design. Stored separately from the image —
 * the original pixels are never modified.
 */
export type DrawingInstruction = {
  id: string
  paths: DrawingPath[]
  /** Default colour / size of the session (individual paths carry their own). */
  color: string
  brushSize: number
  /** Natural size of the image the drawing was made on. */
  imageWidth: number
  imageHeight: number
}

// ── Editing & versions ───────────────────────────────────────

export type DesignVersion = {
  id: string
  projectId: string
  versionNumber: number
  imageUrl: string
  storagePath?: string
  width: number
  height: number
  source: DesignImageSource
  /** Instruction that produced this version ("Original design" for v1). */
  instruction: string
  drawing?: DrawingInstruction
  referenceImageIds?: string[]
  /** Version this one was edited from (null for the original). */
  parentVersionId: string | null
  createdAt: string
}

export type DressEditRequest = {
  projectId: string
  currentImageUrl: string
  currentVersionId: string
  instruction: string
  drawing?: DrawingInstruction
  /** PNG data URL — white = area to change, black = preserve. Derived from `drawing`. */
  maskDataUrl?: string
  referenceImages?: ReferenceImage[]
  /** Optional hint: which part of the dress the customer is talking about. */
  targetArea?: ComponentType | 'whole-dress'
  /** Current design state so the model knows what must be preserved. */
  designBrief?: DesignBrief
}

// ── Project ──────────────────────────────────────────────────

export type ProjectStatus = 'draft' | 'designed' | 'approved'

export type DesignProject = {
  id: string
  userId: string
  title: string
  status: ProjectStatus
  overallReference?: ReferenceImage
  overallAnalysis?: ReferenceAnalysis
  overallInstruction?: string
  components: ComponentReference[]
  designBrief?: DesignBrief
  generatedDesign?: GeneratedDesign
  versions: DesignVersion[]
  /** Extra references uploaded while editing (e.g. a lace close-up). */
  editReferences: ReferenceImage[]
  /** Which version is currently shown/edited. Previous versions are never deleted. */
  currentVersionId?: string
  createdAt: string
  updatedAt: string
}

/** Lightweight row for the "My Designs" grid. */
export type DesignProjectSummary = {
  id: string
  title: string
  status: ProjectStatus
  coverImageUrl?: string
  versionCount: number
  updatedAt: string
}
