import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from './AuthProvider'

/**
 * Protects private pages when Supabase accounts are configured.
 * In local mode (no backend) the studio is open and designs stay on this device.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, mode } = useAuth()
  const location = useLocation()

  if (mode === 'local') return <>{children}</>
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Opening your atelier…" />
      </div>
    )
  }
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  return <>{children}</>
}
