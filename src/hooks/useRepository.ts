import { useMemo } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { getDesignRepository, type DesignRepository } from '@/services/db/designRepository'

export function useRepository(): DesignRepository {
  const { user } = useAuth()
  const userId = user?.id ?? null
  return useMemo(() => getDesignRepository(userId), [userId])
}
