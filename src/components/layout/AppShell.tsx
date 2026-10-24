import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { cn } from '@/lib/cn'
import { ScrollToTop } from './ScrollToTop'

const NAV = [
  { to: '/design', label: 'Design' },
  { to: '/designs', label: 'My Designs' },
  { to: '/library', label: 'Library' },
]

export function AppShell() {
  const { user, mode, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    setOpen(false)
    navigate('/')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-[11px] uppercase tracking-[0.2em] transition-colors',
      isActive ? 'text-ink' : 'text-muted hover:text-ink',
    )

  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <header className="sticky top-0 z-30 border-b border-line/70 bg-ivory/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link to="/" className="group flex items-baseline gap-2" onClick={() => setOpen(false)}>
            <span className="font-display text-xl tracking-[0.18em] text-ink uppercase">Bridal Atelier</span>
            <span className="hidden text-[9px] uppercase tracking-[0.3em] text-gold sm:inline">AI</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={linkClass} end={n.to === '/design' ? false : undefined}>
                {n.label}
              </NavLink>
            ))}
            {mode === 'cloud' &&
              (user ? (
                <button onClick={handleSignOut} className="text-[11px] uppercase tracking-[0.2em] text-muted hover:text-ink">
                  Sign out
                </button>
              ) : (
                <NavLink to="/login" className={linkClass}>
                  Log in
                </NavLink>
              ))}
          </nav>

          <button
            className="flex h-10 w-10 items-center justify-center md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="relative block h-3 w-5">
              <span className={cn('absolute left-0 h-px w-5 bg-ink transition', open ? 'top-1.5 rotate-45' : 'top-0')} />
              <span className={cn('absolute left-0 h-px w-5 bg-ink transition', open ? 'top-1.5 -rotate-45' : 'top-3')} />
            </span>
          </button>
        </div>

        {open && (
          <nav className="border-t border-line bg-ivory px-4 pb-6 pt-2 md:hidden" aria-label="Mobile">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn('block border-b border-line/60 py-4 font-display text-2xl', isActive ? 'text-ink' : 'text-ink-soft')
                }
              >
                {n.label}
              </NavLink>
            ))}
            {mode === 'cloud' &&
              (user ? (
                <button onClick={handleSignOut} className="block py-4 font-display text-2xl text-ink-soft">
                  Sign out
                </button>
              ) : (
                <NavLink to="/login" onClick={() => setOpen(false)} className="block py-4 font-display text-2xl text-ink-soft">
                  Log in
                </NavLink>
              ))}
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line/70 py-8 text-center text-[10px] uppercase tracking-[0.3em] text-muted">
        AI Bridal Atelier
        {mode === 'local' && <span className="mt-2 block normal-case tracking-normal">Local mode · designs are saved on this device</span>}
      </footer>
    </div>
  )
}
