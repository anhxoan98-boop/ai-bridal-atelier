import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** New page → start at the top (query-only changes keep their own scroll handling). */
export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
