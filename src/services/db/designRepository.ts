import { env } from '@/config/env'
import type { DesignProject, DesignProjectSummary } from '@/types/design'
import { LocalDesignRepository } from './localDesignRepository'
import { SupabaseDesignRepository } from './supabaseDesignRepository'

/**
 * Persistence contract. The UI never knows whether designs live in Supabase
 * (cloud, per-user, RLS-protected) or in this browser (local mode).
 */
export interface DesignRepository {
  readonly mode: 'cloud' | 'local'
  list(): Promise<DesignProjectSummary[]>
  load(projectId: string): Promise<DesignProject>
  /** Persist project + all images + versions. Returns the project with storage paths filled in. */
  save(project: DesignProject): Promise<DesignProject>
  remove(projectId: string): Promise<void>
}

export function getDesignRepository(userId: string | null): DesignRepository {
  if (env.isSupabaseConfigured && userId) return new SupabaseDesignRepository(userId)
  return new LocalDesignRepository('projects')
}

/** Crash-safe autosave of the project currently being designed (always local). */
export const draftRepository = new LocalDesignRepository('drafts')
export const CURRENT_DRAFT_ID = 'current'
