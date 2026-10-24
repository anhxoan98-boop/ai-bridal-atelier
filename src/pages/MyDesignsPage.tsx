import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { Spinner } from '@/components/ui/Spinner'
import { StepHeader } from '@/components/ui/StepHeader'
import { useRepository } from '@/hooks/useRepository'
import { MESSAGES } from '@/lib/messages'
import { designActions } from '@/state/designStore'
import type { DesignProjectSummary } from '@/types/design'

export function MyDesignsPage() {
  const repo = useRepository()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<DesignProjectSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      setItems(await repo.list())
    } catch (err) {
      console.error(err)
      setError(MESSAGES.loadFailed)
      setItems([])
    }
  }, [repo])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const open = async (id: string) => {
    setOpeningId(id)
    setError(null)
    try {
      const project = await repo.load(id)
      designActions.loadProject(project)
      navigate(project.versions.length > 0 ? '/design/result' : '/design')
    } catch (err) {
      console.error(err)
      setError(MESSAGES.loadFailed)
    } finally {
      setOpeningId(null)
    }
  }

  const remove = async (id: string) => {
    try {
      await repo.remove(id)
      setConfirmDelete(null)
      await refresh()
    } catch (err) {
      console.error(err)
      setError("We couldn't delete this design. Please try again.")
    }
  }

  const startNew = () => {
    designActions.startNewProject(user?.id)
    navigate('/design')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
      <StepHeader eyebrow="Your atelier" title="My designs" />

      <div className="mt-8 flex justify-center">
        <Button onClick={startNew}>Start a new design</Button>
      </div>

      {repo.mode === 'local' && (
        <Notice tone="info" className="mx-auto mt-8 max-w-2xl">
          Local mode: designs are saved in this browser on this device. Connect Supabase to keep them in your account.
        </Notice>
      )}
      {error && (
        <Notice tone="error" className="mx-auto mt-6 max-w-2xl">
          {error}
        </Notice>
      )}

      {items === null ? (
        <div className="py-20">
          <Spinner label="Gathering your designs…" />
        </div>
      ) : items.length === 0 ? (
        <p className="mt-16 text-center font-display text-2xl italic text-muted">Your saved designs will appear here.</p>
      ) : (
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.id} className="group">
              <button
                type="button"
                onClick={() => open(item.id)}
                disabled={openingId !== null}
                className="relative block aspect-[3/4] w-full overflow-hidden border border-line bg-white"
              >
                {item.coverImageUrl ? (
                  <img
                    src={item.coverImageUrl}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center font-display text-lg italic text-muted">No image yet</span>
                )}
                {openingId === item.id && (
                  <span className="absolute inset-0 flex items-center justify-center bg-ivory/70">
                    <Spinner />
                  </span>
                )}
              </button>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg leading-tight">{item.title}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
                    {item.versionCount} version{item.versionCount === 1 ? '' : 's'} ·{' '}
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                {confirmDelete === item.id ? (
                  <span className="flex shrink-0 gap-2 text-[10px] uppercase tracking-[0.14em]">
                    <button className="text-rose" onClick={() => remove(item.id)}>Delete</button>
                    <button className="text-muted" onClick={() => setConfirmDelete(null)}>Keep</button>
                  </span>
                ) : (
                  <button
                    className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-muted opacity-70 hover:text-rose hover:opacity-100"
                    onClick={() => setConfirmDelete(item.id)}
                    aria-label={`Delete ${item.title}`}
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
