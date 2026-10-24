import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 select-none whitespace-nowrap uppercase transition-all duration-300 disabled:opacity-45 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-ivory hover:bg-gold-deep shadow-soft',
  secondary: 'border border-ink/80 text-ink hover:bg-ink hover:text-ivory',
  ghost: 'border border-line bg-white/60 text-ink-soft hover:border-gold hover:text-ink',
  quiet: 'text-ink-soft hover:text-gold-deep',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[10.5px] tracking-[0.18em]',
  md: 'h-11 px-6 text-[11px] tracking-[0.22em]',
  lg: 'h-14 px-9 text-[12px] tracking-[0.26em]',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return cn(base, variants[variant], sizes[size], extra)
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && (
        <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" aria-hidden />
      )}
      {children}
    </button>
  )
})

type ButtonLinkProps = LinkProps & { variant?: Variant; size?: Size }

export function ButtonLink({ variant = 'primary', size = 'md', className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, typeof className === 'string' ? className : undefined)} {...rest} />
}
