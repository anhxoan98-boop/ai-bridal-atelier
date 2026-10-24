export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-muted" role="status" aria-live="polite">
      <span className="h-7 w-7 animate-spin rounded-full border border-gold/30 border-t-gold" aria-hidden />
      {label && <span className="text-sm tracking-wide">{label}</span>}
    </div>
  )
}
