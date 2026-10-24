import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'info' | 'warning' | 'error' | 'success'

const tones: Record<Tone, string> = {
  info: 'border-champagne bg-pearl text-ink-soft',
  warning: 'border-gold/40 bg-[#fbf3e6] text-ink-soft',
  error: 'border-rose/30 bg-blush text-rose',
  success: 'border-sage/30 bg-[#eef2ec] text-sage',
}

const icons: Record<Tone, string> = { info: '✦', warning: '◇', error: '!', success: '✓' }

export function Notice({
  tone = 'info',
  title,
  children,
  action,
  className,
}: {
  tone?: Tone
  title?: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 border px-4 py-3 text-sm leading-relaxed', tones[tone], className)}
    >
      <span className="mt-px font-display text-base leading-none" aria-hidden>
        {icons[tone]}
      </span>
      <div className="flex-1">
        {title && <p className="font-normal">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'opacity-90')}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  )
}
