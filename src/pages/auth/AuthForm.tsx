import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { authService } from '@/services/auth/authService'

type Mode = 'login' | 'signup'

export function AuthForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))

  const available = authService.isAvailable()
  const isSignup = mode === 'signup'

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (isSignup && password.length < 8) {
      setError('Please choose a password with at least 8 characters.')
      return
    }
    setBusy(true)
    const result = isSignup ? await authService.signUp(email.trim(), password) : await authService.signIn(email.trim(), password)
    setBusy(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    if (result.needsEmailConfirmation) {
      setInfo('Almost there — please confirm your email address, then log in.')
      return
    }
    navigate(next, { replace: true })
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <div className="text-center">
        <p className="eyebrow">{isSignup ? 'Welcome' : 'Welcome back'}</p>
        <h1 className="mt-3 text-4xl tracking-[0.08em] uppercase">{isSignup ? 'Create account' : 'Log in'}</h1>
        <div className="mx-auto my-5 hairline" />
      </div>

      {!available && (
        <Notice tone="warning" title="Accounts are not configured" className="mb-6">
          Supabase is not connected yet, so the studio runs in local mode: you can design right away and your
          designs are saved on this device.{' '}
          <Link to="/design" className="underline underline-offset-4">
            Start designing
          </Link>
        </Notice>
      )}

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input"
            disabled={!available || busy}
          />
        </div>
        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
            minLength={isSignup ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-input"
            disabled={!available || busy}
          />
        </div>

        {error && <Notice tone="error">{error}</Notice>}
        {info && <Notice tone="success">{info}</Notice>}

        <Button type="submit" className="w-full" size="lg" loading={busy} disabled={!available || !email || !password}>
          {isSignup ? 'Create account' : 'Log in'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        {isSignup ? 'Already have an account?' : 'New to the atelier?'}{' '}
        <Link
          to={isSignup ? `/login?next=${encodeURIComponent(next)}` : `/signup?next=${encodeURIComponent(next)}`}
          className="text-ink underline decoration-gold/60 underline-offset-4 hover:decoration-gold"
        >
          {isSignup ? 'Log in' : 'Create an account'}
        </Link>
      </p>
    </section>
  )
}

/** Only allow internal redirects (prevents open-redirects via ?next=). */
function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/design'
  return next
}
