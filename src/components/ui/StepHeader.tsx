import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function StepHeader({
  eyebrow,
  title,
  lead,
  support,
  align = 'center',
}: {
  eyebrow?: string
  title: string
  lead?: ReactNode
  support?: ReactNode
  align?: 'center' | 'left'
}) {
  return (
    <header className={cn('animate-fade-up', align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl')}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="mt-3 text-4xl leading-[1.05] tracking-[0.06em] uppercase sm:text-5xl">{title}</h1>
      <div className={cn('my-5 hairline', align === 'center' && 'mx-auto')} />
      {lead && <p className="font-display text-xl italic text-ink-soft sm:text-2xl">{lead}</p>}
      {support && <p className="mt-3 text-[15px] leading-relaxed text-muted">{support}</p>}
    </header>
  )
}
